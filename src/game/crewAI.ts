import { ShipState, CrewStatus, Encounter, LLMCrewResponse, SettingsState } from '../types';

export interface RetryOptions {
  /** Maximum number of retry attempts after the initial failure (default: 3) */
  maxRetries?: number;
  /** Initial delay before the first retry in milliseconds (default: 600) */
  initialDelayMs?: number;
  /** Maximum backoff delay cap in milliseconds (default: 5000) */
  maxDelayMs?: number;
  /** Exponential multiplier per retry step (default: 2) */
  backoffFactor?: number;
  /** Whether to inject random jitter to avoid synchronized retry bursts (default: true) */
  jitter?: boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 600,
  maxDelayMs: 5000,
  backoffFactor: 2,
  jitter: true,
};

/**
 * Checks whether an HTTP status code represents a transient condition eligible for retry.
 * - 429: Too Many Requests / Rate limiting
 * - 500: Internal Server Error (e.g. temporary downstream model failure)
 * - 502: Bad Gateway
 * - 503: Service Unavailable
 * - 504: Gateway Timeout
 */
function isTransientHttpStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 504);
}

/**
 * Pauses execution for a specified duration in milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs POST request to /api/crew-command with exponential backoff for
 * transient network failures and rate limits.
 */
async function fetchCrewCommandWithBackoff(
  payload: Record<string, unknown>,
  options?: RetryOptions
): Promise<Response> {
  const { maxRetries, initialDelayMs, maxDelayMs, backoffFactor, jitter } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;
  let nextDelayMs: number | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // If a retry was scheduled, apply the exponential backoff delay before re-attempting
    if (attempt > 0 && nextDelayMs !== null) {
      console.info(
        `[CrewAI] Retrying command API in ${Math.round(nextDelayMs)}ms (retry ${attempt}/${maxRetries})...`
      );
      await sleep(nextDelayMs);
    }

    try {
      const response = await fetch('/api/crew-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Successful response received
      if (response.ok) {
        return response;
      }

      lastResponse = response;

      // Handle transient errors (Rate limiting 429, or server errors 500-504)
      if (isTransientHttpStatus(response.status) && attempt < maxRetries) {
        let delay = initialDelayMs * Math.pow(backoffFactor, attempt);

        // If rate limited, check for standard Retry-After header
        if (response.status === 429) {
          const retryAfterHeader = response.headers?.get('Retry-After');
          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
              delay = parsedSeconds * 1000;
            }
          }
        }

        // Apply jitter (up to +25% randomization) to prevent stampeding herd
        if (jitter) {
          delay += Math.random() * (delay * 0.25);
        }

        nextDelayMs = Math.min(delay, maxDelayMs);
        console.warn(
          `[CrewAI] API returned status ${response.status} (${response.statusText}). Retrying in ${Math.round(nextDelayMs)}ms... (attempt ${attempt + 1}/${maxRetries})`
        );
        continue;
      }

      // Non-transient HTTP errors (e.g. 400 Bad Request, 401 Unauthorized, 403 Forbidden)
      // or retries exhausted: break immediately to avoid pointless delays
      break;
    } catch (err) {
      // Network drop, timeout, or DNS resolution failure
      lastError = err as Error;

      if (attempt < maxRetries) {
        let delay = initialDelayMs * Math.pow(backoffFactor, attempt);
        if (jitter) {
          delay += Math.random() * (delay * 0.25);
        }
        nextDelayMs = Math.min(delay, maxDelayMs);

        console.warn(
          `[CrewAI] Transient network error: ${lastError?.message || err}. Retrying in ${Math.round(nextDelayMs)}ms (attempt ${attempt + 1}/${maxRetries})...`
        );
        continue;
      }
      break;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('Failed to reach backend AI service after exponential backoff retries.');
}

/**
 * Dispatches player command to backend LLM route or intelligent simulation engine
 * with automatic exponential backoff retry for transient network issues or rate limiting.
 */
export async function sendCrewCommand(
  command: string,
  shipState: ShipState,
  crewStatus: CrewStatus,
  currentEncounter: Encounter | null,
  recentDialogue: Array<{ speaker: string; text: string }>,
  settings: SettingsState,
  retryOptions?: RetryOptions
): Promise<LLMCrewResponse> {
  // If user selected offline simulation mode explicitly
  if (settings.provider === 'simulation') {
    return generateSimulatedCrewResponse(command, shipState, crewStatus, currentEncounter);
  }

  try {
    const customKey = settings.provider === 'openai' 
      ? settings.customOpenAiKey 
      : settings.customGeminiKey;

    const payload = {
      command,
      shipState,
      crewStatus,
      currentEncounter,
      recentHistory: recentDialogue.slice(-4),
      provider: settings.provider,
      customKey: customKey || undefined,
    };

    // Execute API call with exponential backoff for transient issues or rate limiting
    const response = await fetchCrewCommandWithBackoff(payload, retryOptions);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.warn('API error from /api/crew-command after backoff retries, using fallback simulation:', errJson);
      return generateSimulatedCrewResponse(command, shipState, crewStatus, currentEncounter);
    }

    const data: LLMCrewResponse = await response.json();
    if (!data.dialogue || !Array.isArray(data.dialogue) || data.dialogue.length === 0) {
      return generateSimulatedCrewResponse(command, shipState, crewStatus, currentEncounter);
    }

    return data;
  } catch (err) {
    console.warn('Network error reaching backend AI after backoff retries, executing crew simulation fallback:', err);
    return generateSimulatedCrewResponse(command, shipState, crewStatus, currentEncounter);
  }
}

/**
 * Highly reactive, personality-accurate local simulation engine
 * Accurately interprets captain orders, routes to the appropriate officer,
 * and distinguishes between action orders and informational status queries.
 */
export function generateSimulatedCrewResponse(
  command: string,
  shipState: ShipState,
  crewStatus: CrewStatus,
  currentEncounter: Encounter | null
): LLMCrewResponse {
  const lower = command.toLowerCase().trim();
  const dialogue: Array<{ speaker: 'Jax' | 'Elara' | 'Ship AI'; text: string }> = [];
  const actions: Array<{ type: any; value: number; reason: string }> = [];
  let analysis = 'Order logged in starship flight computer.';
  let routedOfficer: 'Jax' | 'Elara' | 'Both' | 'Ship AI' = 'Both';
  let intent: 'action' | 'query' | 'conversation' = 'action';

  // 1. OFFICER ROUTING DETECTION
  const mentionsJax = /\bjax\b|\bengineer\b|\bchief\b/i.test(lower);
  const mentionsElara = /\belara\b|\bscience\b|\bdoctor\b/i.test(lower);
  const mentionsBoth = /\bcrew\b|\bboth\b|\bbridge\b|\ball hands\b|\beveryone\b/i.test(lower);

  if (mentionsJax && !mentionsElara) {
    routedOfficer = 'Jax';
  } else if (mentionsElara && !mentionsJax) {
    routedOfficer = 'Elara';
  } else if (mentionsBoth) {
    routedOfficer = 'Both';
  }

  // 2. QUERY / STATUS CHECK DETECTION
  const isQuestion =
    lower.includes('?') ||
    lower.startsWith('how') ||
    lower.startsWith('what') ||
    lower.startsWith('is ') ||
    lower.startsWith('are ') ||
    lower.startsWith('can ') ||
    lower.includes('status') ||
    lower.includes('report') ||
    lower.includes('hows') ||
    lower.includes("how's") ||
    lower.includes('how are') ||
    lower.includes('how is') ||
    lower.includes('feel') ||
    lower.includes('stress') ||
    lower.includes('readings');

  // Case A: Specific inquiry about STRESS
  if (lower.includes('stress')) {
    intent = 'query';
    if (routedOfficer === 'Elara' || (mentionsElara && !mentionsJax)) {
      routedOfficer = 'Elara';
      const elaraStress = crewStatus.elaraStress ?? 12;
      dialogue.push({
        speaker: 'Elara',
        text: `My stress level is measured at ${elaraStress}%, Captain. Vital biometric readings and neurological coherence remain stable, operating well within standard analytical parameters.`,
      });
      analysis = `Science Officer Elara reports stress telemetry at ${elaraStress}%.`;
      return { routedOfficer, intent, dialogue, actions: [], analysis };
    } else if (routedOfficer === 'Jax' || (mentionsJax && !mentionsElara)) {
      routedOfficer = 'Jax';
      dialogue.push({
        speaker: 'Jax',
        text: `Stress is sitting at ${crewStatus.jaxStress}%, Cap! With these reactor coils vibrating and sparks flying out of the conduits, keeping her in one piece isn't exactly a walk in the park!`,
      });
      analysis = `Chief Engineer Jax reports stress telemetry at ${crewStatus.jaxStress}%.`;
      return { routedOfficer, intent, dialogue, actions: [], analysis };
    } else {
      // General stress inquiry to both
      const elaraStress = crewStatus.elaraStress ?? 12;
      dialogue.push({
        speaker: 'Elara',
        text: `My stress level is measured at ${elaraStress}%, Captain. Analytical cognition is unaffected.`,
      });
      dialogue.push({
        speaker: 'Jax',
        text: `And I'm at ${crewStatus.jaxStress}% stress back here in engineering. Watch the throttle and we'll keep it from climbing!`,
      });
      analysis = `Bridge crew stress telemetry reported: Jax ${crewStatus.jaxStress}%, Elara ${elaraStress}%.`;
      return { routedOfficer, intent, dialogue, actions: [], analysis };
    }
  }

  // Case B: General STATUS / TELEMETRY REPORT query
  if (isQuestion && (lower.includes('status') || lower.includes('report') || lower.includes('how are we') || lower.includes('how is') || lower.includes("how's"))) {
    intent = 'query';
    if (routedOfficer === 'Jax') {
      dialogue.push({
        speaker: 'Jax',
        text: `Hull integrity is at ${Math.round(shipState.hull)}%, reactor energy grid is at ${Math.round(shipState.energy)}%, and we're cruising at Speed ${shipState.speed}/5. My stress is at ${crewStatus.jaxStress}%.`,
      });
      analysis = 'Engineering status report delivered by Chief Engineer Jax.';
      return { routedOfficer, intent, dialogue, actions: [], analysis };
    } else if (routedOfficer === 'Elara') {
      const elaraStress = crewStatus.elaraStress ?? 12;
      dialogue.push({
        speaker: 'Elara',
        text: `Deflector shields are calibrated at ${Math.round(shipState.shields)}%. Forward sensors register ${currentEncounter ? `active threat "${currentEncounter.title}"` : 'clear interstellar void'}. Personal stress: ${elaraStress}%, curiosity: ${crewStatus.elaraCuriosity}%.`,
      });
      analysis = 'Science division telemetry report delivered by Science Officer Elara.';
      return { routedOfficer, intent, dialogue, actions: [], analysis };
    } else {
      dialogue.push({
        speaker: 'Ship AI',
        text: `DIAGNOSTIC REPORT: Hull ${Math.round(shipState.hull)}% | Energy ${Math.round(shipState.energy)}% | Shields ${Math.round(shipState.shields)}% | Speed ${shipState.speed}/5. Subsystems operating nominally.`,
      });
      analysis = 'Starship automated diagnostic summary issued.';
      return { routedOfficer, intent, dialogue, actions: [], analysis };
    }
  }

  // Case C: Conversational greetings & pleasantries
  if (lower === 'hello' || lower === 'hi' || lower.includes('good morning') || lower.includes('how are you') || lower.includes('good job') || lower.includes('thank you') || lower.includes('thanks')) {
    intent = 'conversation';
    if (routedOfficer === 'Jax') {
      dialogue.push({
        speaker: 'Jax',
        text: lower.includes('thank') || lower.includes('good job')
          ? "Just doing my job, Captain. Keep us out of asteroid belts and we're even!"
          : "Hear you loud and clear, Cap. Just keeping an eye on the injector coolant.",
      });
    } else if (routedOfficer === 'Elara') {
      dialogue.push({
        speaker: 'Elara',
        text: lower.includes('thank') || lower.includes('good job')
          ? "Compliment noted, Captain. Sustained survival is our highest mutual probability."
          : "Greetings, Captain. Subspace telemetry channels are open and ready for your directives.",
      });
    } else {
      dialogue.push({
        speaker: 'Jax',
        text: 'Bridge audio checks out, Cap. Engines are rumbling.',
      });
      dialogue.push({
        speaker: 'Elara',
        text: 'Sensors linked to command console. Awaiting your instructions.',
      });
    }
    analysis = 'Bridge crew communication acknowledged.';
    return { routedOfficer, intent, dialogue, actions: [], analysis };
  }

  // 3. ACTION ORDERS

  // Action 1: REDUCE THROTTLE / SLOW DOWN / CUT ENGINES / STOP
  const isReduceThrottle =
    lower.includes('reduce throttle') ||
    lower.includes('decrease throttle') ||
    lower.includes('lower throttle') ||
    lower.includes('drop throttle') ||
    lower.includes('cut throttle') ||
    lower.includes('slow down') ||
    lower.includes('decelerate') ||
    lower.includes('brake') ||
    lower.includes('reduce speed') ||
    lower.includes('lower speed') ||
    lower.includes('drop speed') ||
    lower.includes('ease off');

  const isFullStop =
    lower.includes('stop') ||
    lower.includes('full stop') ||
    lower.includes('halt') ||
    lower.includes('cut engine') ||
    lower.includes('cut thruster') ||
    lower.includes('zero speed') ||
    lower.includes('speed 0') ||
    lower.includes('idle');

  if (isFullStop || isReduceThrottle) {
    routedOfficer = mentionsElara && !mentionsJax ? 'Elara' : 'Jax';
    intent = 'action';

    if (isFullStop) {
      if (shipState.speed === 0) {
        dialogue.push({
          speaker: 'Jax',
          text: "Captain, we're already at a complete standstill! Engines are idling in neutral drift.",
        });
      } else {
        dialogue.push({
          speaker: 'Jax',
          text: 'Cutting sub-light thrust to zero. Disengaging drive coils into stationary drift. Manifolds cooling down.',
        });
        actions.push({ type: 'change_speed', value: -shipState.speed, reason: 'Engine throttle cut to full stop' });
        analysis = 'Ship throttled down to full stationary drift.';
      }
    } else {
      // Reduce throttle by 1 step
      if (shipState.speed <= 0) {
        dialogue.push({
          speaker: 'Jax',
          text: "We're already at Speed 0, Cap! We can't reduce throttle any further without going in reverse!",
        });
      } else {
        const nextSpeed = Math.max(0, shipState.speed - 1);
        dialogue.push({
          speaker: 'Jax',
          text: `Aye Captain, reducing throttle. Stepping down engine output to Speed ${nextSpeed}. Relief on the warp coils!`,
        });
        actions.push({ type: 'change_speed', value: -1, reason: 'Throttle reduced by order of Captain' });
        analysis = `Throttle reduced to Speed ${nextSpeed}.`;
      }
    }

    if (mentionsBoth) {
      dialogue.push({
        speaker: 'Elara',
        text: 'Velocity deceleration curve registered. Forward collision hazard mitigated.',
      });
    }

    return { routedOfficer, intent, dialogue, actions, analysis };
  }

  // Action 2: INCREASE THROTTLE / ACCELERATE / SPEED UP
  const isAccelerate =
    lower.includes('increase throttle') ||
    lower.includes('raise throttle') ||
    lower.includes('throttle up') ||
    lower.includes('accelerate') ||
    lower.includes('speed up') ||
    lower.includes('faster') ||
    lower.includes('full burn') ||
    lower.includes('max burn') ||
    lower.includes('full throttle') ||
    lower.includes('burn') ||
    lower.includes('boost') ||
    lower.includes('speed');

  if (isAccelerate) {
    routedOfficer = mentionsElara && !mentionsJax ? 'Elara' : 'Jax';
    intent = 'action';

    let targetSpeed = Math.min(5, shipState.speed + 1);
    if (lower.includes('max') || lower.includes('full') || lower.includes('5')) {
      targetSpeed = 5;
    } else if (lower.includes('4')) {
      targetSpeed = 4;
    } else if (lower.includes('3')) {
      targetSpeed = 3;
    } else if (lower.includes('2')) {
      targetSpeed = 2;
    } else if (lower.includes('1')) {
      targetSpeed = 1;
    }

    const delta = targetSpeed - shipState.speed;
    if (delta <= 0) {
      dialogue.push({
        speaker: 'Jax',
        text: `We're already running at Speed ${shipState.speed}, Captain! Manifold can't push any harder without blowing a gasket!`,
      });
    } else {
      dialogue.push({
        speaker: 'Jax',
        text: targetSpeed >= 4
          ? `Pushing to Speed ${targetSpeed}?! The manifold is screaming, Captain! Firing injection thrusters!`
          : `Engaging burn to Speed ${targetSpeed}. Thrust vectors locked.`,
      });
      actions.push({ type: 'change_speed', value: delta, reason: `Throttle increased to Speed ${targetSpeed}` });
      actions.push({ type: 'change_energy', value: -8, reason: 'Sub-light engine acceleration draw' });
      analysis = `Thrust increased to Speed ${targetSpeed}.`;

      if (mentionsBoth || targetSpeed >= 4) {
        dialogue.push({
          speaker: 'Elara',
          text: `Relativistic Doppler shift registered. Forward collision probability scaling to ${(targetSpeed * 18)}%.`,
        });
      }
    }

    return { routedOfficer, intent, dialogue, actions, analysis };
  }

  // Action 3: SHIELDS / DEFLECTOR
  if (lower.includes('shield') || lower.includes('defend') || lower.includes('barrier') || lower.includes('protect')) {
    routedOfficer = 'Elara';
    intent = 'action';

    if (shipState.energy >= 15) {
      dialogue.push({
        speaker: 'Elara',
        text: 'Modulating deflector grid to resonate at inverse frequency. Shields reinforced by 25%.',
      });
      actions.push({ type: 'change_shields', value: 25, reason: 'Shield grid modulation' });
      actions.push({ type: 'change_energy', value: -15, reason: 'Deflector emitter power draw' });
      analysis = 'Deflector shields boosted at the expense of capacitor reserve.';

      if (mentionsBoth || !mentionsElara) {
        dialogue.push({
          speaker: 'Jax',
          text: 'That drained another chunk of the capacitors, Elara! Keep an eye on the heat sink!',
        });
      }
    } else {
      dialogue.push({
        speaker: 'Elara',
        text: `Insufficient auxiliary energy (${Math.round(shipState.energy)}% remaining). Modulating shields would cause catastrophic capacitor brownout.`,
      });
      if (mentionsBoth || mentionsJax) {
        dialogue.push({
          speaker: 'Jax',
          text: `Cap, we need juice before we can charge those emitters! Siphon some cosmic radiation first!`,
        });
      }
    }

    return { routedOfficer, intent, dialogue, actions, analysis };
  }

  // Action 4: REPAIR / HULL / FIX
  if (lower.includes('repair') || lower.includes('fix') || lower.includes('patch') || lower.includes('hull') || lower.includes('nanite')) {
    routedOfficer = 'Jax';
    intent = 'action';

    if (shipState.energy >= 20) {
      dialogue.push({
        speaker: 'Jax',
        text: shipState.hull < 50
          ? "FINALLY! Deploying nanite welding drones to the outer bulkheads! Hang onto your helmets!"
          : "On it, Captain! Patching the micro-fractures in the starboard armor plate. Good as new.",
      });
      actions.push({ type: 'change_hull', value: 20, reason: 'Nanite emergency hull repair' });
      actions.push({ type: 'change_energy', value: -20, reason: 'Repair fabrication power' });
      analysis = 'Hull reinforced via nanite patch.';

      if (mentionsBoth) {
        dialogue.push({
          speaker: 'Elara',
          text: 'Structural integrity sensors confirm positive hull matrix reformation.',
        });
      }
    } else {
      dialogue.push({
        speaker: 'Jax',
        text: "I can't run the repair lasers with a dry battery, Captain! Give me some juice first!",
      });
      if (mentionsBoth) {
        dialogue.push({
          speaker: 'Elara',
          text: 'Recommendation: siphon energy from nearby cosmic matter before initiating structural repairs.',
        });
      }
    }

    return { routedOfficer, intent, dialogue, actions, analysis };
  }

  // Action 5: SCAN / SENSORS / ANOMALY
  if (lower.includes('scan') || lower.includes('sensor') || lower.includes('analyze') || lower.includes('investigate') || lower.includes('science')) {
    routedOfficer = 'Elara';
    intent = 'action';

    if (currentEncounter) {
      dialogue.push({
        speaker: 'Elara',
        text: `Fascinating. Long-range telemetry on the ${currentEncounter.title} reveals high particle symmetry. Siphoning ambient tachyon radiation.`,
      });
      actions.push({ type: 'scan_anomaly', value: 1, reason: 'Deep sensor spectrum sweep' });
      actions.push({ type: 'change_energy', value: 25, reason: 'Siphoned ambient cosmic energy' });
      analysis = `Sensor sweep completed on ${currentEncounter.title}. Auxiliary energy harvested.`;

      if (mentionsBoth || mentionsJax) {
        dialogue.push({
          speaker: 'Jax',
          text: 'Just make sure that "fascinating" radiation doesn\'t melt my thruster injector valves!',
        });
      }
    } else {
      dialogue.push({
        speaker: 'Elara',
        text: 'Sweeping forward sector... Deep space background noise is nominal. No immediate anomalies in range.',
      });
      actions.push({ type: 'change_energy', value: 5, reason: 'Solar array trickle recharge' });
      analysis = 'Sensor sweep clear. Solar collector trickle harvested.';
    }

    return { routedOfficer, intent, dialogue, actions, analysis };
  }

  // Action 6: EVASIVE MANEUVER / DODGE
  if (lower.includes('evasive') || lower.includes('dodge') || lower.includes('avoid') || lower.includes('maneuver')) {
    routedOfficer = 'Both';
    intent = 'action';

    dialogue.push({
      speaker: 'Jax',
      text: 'Hard to port! Firing chemical thrusters! Hold onto your seats!',
    });
    dialogue.push({
      speaker: 'Elara',
      text: 'Calculating optimal vector through the hazard zone... clear corridor identified!',
    });
    actions.push({ type: 'evasive_burn', value: 15, reason: 'Evasive vector maneuver' });
    actions.push({ type: 'change_energy', value: -10, reason: 'RCS thruster dump' });
    actions.push({ type: 'change_shields', value: 10, reason: 'Deflective angle positioning' });
    analysis = 'Evasive roll successfully executed.';

    return { routedOfficer, intent, dialogue, actions, analysis };
  }

  // Action 7: POWER / SIPHON / SOLAR / RECHARGE
  if (lower.includes('power') || lower.includes('divert') || lower.includes('siphon') || lower.includes('solar') || lower.includes('recharge')) {
    routedOfficer = 'Elara';
    intent = 'action';

    dialogue.push({
      speaker: 'Elara',
      text: 'Deploying high-gain photovoltaic collectors and quantum collectors. Siphoning ambient stellar flux.',
    });
    actions.push({ type: 'change_energy', value: 30, reason: 'Solar collector energy siphon' });
    analysis = 'Energy reserves replenished.';

    if (mentionsBoth || mentionsJax) {
      dialogue.push({
        speaker: 'Jax',
        text: 'Bypassing auxiliary relays. Batteries are taking the charge smoothly! +30 Energy!',
      });
    }

    return { routedOfficer, intent, dialogue, actions, analysis };
  }

  // Fallback: Acknowledged order
  if (routedOfficer === 'Jax') {
    dialogue.push({
      speaker: 'Jax',
      text: `Acknowledged, Captain. Monitoring reactor coils and thrust manifolds.`,
    });
  } else if (routedOfficer === 'Elara') {
    dialogue.push({
      speaker: 'Elara',
      text: `Standing by, Captain. Sensor telemetry calibrated to your coordinates.`,
    });
  } else {
    dialogue.push({
      speaker: 'Jax',
      text: `Order acknowledged, Cap. Systems are standing by.`,
    });
    dialogue.push({
      speaker: 'Elara',
      text: `Standing by for further tactical input.`,
    });
  }
  intent = 'conversation';
  analysis = 'Bridge crew standing by for tactical input.';

  return { routedOfficer, intent, dialogue, actions, analysis };
}
