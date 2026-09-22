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
 * Used when offline, during network latency, or when testing without API keys.
 */
export function generateSimulatedCrewResponse(
  command: string,
  shipState: ShipState,
  crewStatus: CrewStatus,
  currentEncounter: Encounter | null
): LLMCrewResponse {
  const lower = command.toLowerCase();
  const dialogue: Array<{ speaker: 'Jax' | 'Elara' | 'Ship AI'; text: string }> = [];
  const actions: Array<{ type: any; value: number; reason: string }> = [];
  let analysis = 'Tactical standing order processed.';

  const isLowHull = shipState.hull < 50;
  const isLowEnergy = shipState.energy < 25;

  // 1. SHIELD ORDERS / DEFENSE
  if (lower.includes('shield') || lower.includes('defend') || lower.includes('barrier') || lower.includes('protect')) {
    if (shipState.energy >= 15) {
      dialogue.push({
        speaker: 'Elara',
        text: 'Modulating deflector grid to resonate at inverse frequency. Shields reinforced by 25%.',
      });
      dialogue.push({
        speaker: 'Jax',
        text: 'That drained another chunk of the capacitors, Elara! Keep an eye on the heat sink!',
      });
      actions.push({ type: 'change_shields', value: 25, reason: 'Shield grid modulation' });
      actions.push({ type: 'change_energy', value: -15, reason: 'Deflector emitter power draw' });
      analysis = 'Deflector shields boosted at the expense of capacitor reserve.';
    } else {
      dialogue.push({
        speaker: 'Jax',
        text: `Captain, we're down to ${shipState.energy}% energy! The emitter would blowout if I charge shields now!`,
      });
      dialogue.push({
        speaker: 'Elara',
        text: 'Energy reserves insufficient for structural forcefield sustainment.',
      });
    }
  }
  // 2. REPAIR / HULL / FIX
  else if (lower.includes('repair') || lower.includes('fix') || lower.includes('patch') || lower.includes('hull')) {
    if (shipState.energy >= 20) {
      dialogue.push({
        speaker: 'Jax',
        text: isLowHull
          ? "FINALLY! Deploying nanite welding drones to the outer bulkheads! Hang on to your helmets!"
          : "On it, Captain! Patching the micro-fractures in the starboard plate. Good as new.",
      });
      dialogue.push({
        speaker: 'Elara',
        text: 'Structural integrity sensors confirm positive hull matrix reformation.',
      });
      actions.push({ type: 'change_hull', value: 20, reason: 'Nanite emergency hull repair' });
      actions.push({ type: 'change_energy', value: -20, reason: 'Repair fabrication power' });
      analysis = 'Hull reinforced via nanite patch.';
    } else {
      dialogue.push({
        speaker: 'Jax',
        text: "I can't run the repair lasers with a dry battery, Captain! Give me some juice first!",
      });
      dialogue.push({
        speaker: 'Elara',
        text: 'Recommendation: siphon energy from nearby cosmic matter before initiating structural repairs.',
      });
    }
  }
  // 3. SCAN / SENSORS / ANOMALY / ANALYZE
  else if (lower.includes('scan') || lower.includes('sensor') || lower.includes('analyze') || lower.includes('investigate') || lower.includes('science')) {
    if (currentEncounter) {
      dialogue.push({
        speaker: 'Elara',
        text: `Fascinating. Long-range telemetry on the ${currentEncounter.title} reveals high particle symmetry. Siphoning ambient tachyon radiation.`,
      });
      dialogue.push({
        speaker: 'Jax',
        text: 'Just make sure that "fascinating" radiation doesn\'t melt my thruster injector valves!',
      });
      actions.push({ type: 'scan_anomaly', value: 1, reason: 'Deep sensor spectrum sweep' });
      actions.push({ type: 'change_energy', value: 25, reason: 'Siphoned ambient cosmic energy' });
      analysis = `Sensor sweep completed on ${currentEncounter.title}. Auxiliary energy harvested.`;
    } else {
      dialogue.push({
        speaker: 'Elara',
        text: 'Sweeping forward sector... Deep space background noise is nominal. No immediate anomalies in range.',
      });
      dialogue.push({
        speaker: 'Jax',
        text: 'Clear skies for once. Don\'t jinx it, Science Officer.',
      });
      actions.push({ type: 'change_energy', value: 5, reason: 'Solar array trickle recharge' });
    }
  }
  // 4. SPEED / ENGINES / THRUST / ACCELERATE / FULL THROTTLE
  else if (lower.includes('speed') || lower.includes('fast') || lower.includes('throttle') || lower.includes('accelerate') || lower.includes('burn') || lower.includes('boost')) {
    if (lower.includes('stop') || lower.includes('zero') || lower.includes('halt') || lower.includes('slow')) {
      dialogue.push({
        speaker: 'Jax',
        text: 'Cutting sub-light thrust. Engines idling at minimum drift. Nice to let the reactor cool down.',
      });
      dialogue.push({
        speaker: 'Elara',
        text: 'Velocity reduced to near zero relative to local stellar cluster.',
      });
      actions.push({ type: 'change_speed', value: -shipState.speed, reason: 'Engine idle cut' });
      analysis = 'Ship throttled down to full stop.';
    } else {
      const targetSpeed = Math.min(5, shipState.speed + 2);
      dialogue.push({
        speaker: 'Jax',
        text: targetSpeed >= 4
          ? `Pushing to Speed ${targetSpeed}?! The manifold is screaming, Captain! Doing it anyway!`
          : `Engaging burn to Speed ${targetSpeed}. Thrust vectors locked.`,
      });
      dialogue.push({
        speaker: 'Elara',
        text: `Relativistic Doppler shift registered. Forward collision risk scaling by ${targetSpeed * 15}%.`,
      });
      actions.push({ type: 'change_speed', value: Math.min(2, 5 - shipState.speed), reason: 'Engine throttle forward' });
      actions.push({ type: 'change_energy', value: -10, reason: 'Sub-light engine burn' });
      analysis = `Thrust increased to Speed ${targetSpeed}.`;
    }
  }
  // 5. SLOW DOWN / REVERSE / BRAKE
  else if (lower.includes('slow') || lower.includes('brake') || lower.includes('decelerate')) {
    dialogue.push({
      speaker: 'Jax',
      text: 'Firing reverse attitude thrusters! Speed dropping back down.',
    });
    dialogue.push({
      speaker: 'Elara',
      text: 'Kinetic energy dissipated safely into surrounding vacuum.',
    });
    actions.push({ type: 'change_speed', value: -1, reason: 'Attitude thruster braking' });
    analysis = 'Speed reduced by 1.';
  }
  // 6. EVASIVE MANEUVER / DODGE / OUT OF THE WAY
  else if (lower.includes('evasive') || lower.includes('dodge') || lower.includes('avoid') || lower.includes('maneuver')) {
    dialogue.push({
      speaker: 'Jax',
      text: 'Hard to port! Firing chemical thrusters! Hold onto your seats!',
    });
    dialogue.push({
      speaker: 'Elara',
      text: 'Calculating optimal vector through the debris field... clear corridor identified!',
    });
    actions.push({ type: 'evasive_burn', value: 15, reason: 'Evasive vector maneuver' });
    actions.push({ type: 'change_energy', value: -10, reason: 'RCS thruster dump' });
    actions.push({ type: 'change_shields', value: 10, reason: 'Deflective angle positioning' });
    analysis = 'Evasive roll successfully executed.';
  }
  // 7. POWER / ENERGY / DIVERT / SIPHON
  else if (lower.includes('power') || lower.includes('divert') || lower.includes('siphon') || lower.includes('solar') || lower.includes('recharge')) {
    dialogue.push({
      speaker: 'Elara',
      text: 'Deploying high-gain photovoltaic collectors and quantum collectors. Siphoning ambient stellar flux.',
    });
    dialogue.push({
      speaker: 'Jax',
      text: 'Bypassing auxiliary relays. Batteries are taking the charge smoothly! +30 Energy!',
    });
    actions.push({ type: 'change_energy', value: 30, reason: 'Solar collector energy siphon' });
    analysis = 'Energy reserves replenished.';
  }
  // 8. GENERAL / CASUAL / CREW BANTER
  else {
    dialogue.push({
      speaker: 'Jax',
      text: isLowHull 
        ? `I hear ya, Cap, but look at the sparks flying back here! I'm doing the best I can!`
        : `Acknowledged, Captain. Maintaining engine diagnostics and coolant flows.`,
    });
    dialogue.push({
      speaker: 'Elara',
      text: `Tactical order "${command}" logged in starship flight recorder. Standing by for specific system routing.`,
    });
    actions.push({ type: 'change_energy', value: 5, reason: 'Auxiliary trickle generation' });
  }

  return { dialogue, actions, analysis };
}
