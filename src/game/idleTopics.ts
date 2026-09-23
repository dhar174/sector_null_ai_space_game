import { IdleTopic, ShipState, CrewStatus, Encounter } from '../types';

export const IDLE_TOPIC_POOL: Omit<IdleTopic, 'id' | 'availableAt'>[] = [
  // JAX TOPICS - ENGINEERING & SHIP LIFE
  {
    officer: 'Jax',
    title: 'Conduit 7 Harmonic Resonances',
    hook: 'Jax noticed an odd 420 Hz harmonic in the coolant loop.',
    snippet: 'Cap, port injector coil is vibrating at 420 Hz. Just an old spacer\'s hunch, but she needs a little TLC.',
    promptSuggestion: 'Jax, what is that 420 Hz coil vibration you noticed in Conduit 7?',
    dialogueResponse: 'Glad you asked, Cap! Port injector manifold was chattering against the bulkhead clamp. Tightened the magnetic bracket with my plasma wrench. Hum is purring down to 60 Hz now—smooth as velvet!',
    category: 'engineering',
  },
  {
    officer: 'Jax',
    title: 'Galley Coffee Synthesizer Glitch',
    hook: 'Jax is grumbling about the galley beverage synthesizer.',
    snippet: 'Someone re-routed the galley synthesizer coolant into the hydro-filter. Coffee tastes like battery acid again.',
    promptSuggestion: 'Jax, what happened to the galley coffee synthesizer?',
    dialogueResponse: 'Ha! I caught a junior tech feeding recycled thruster lubricant through the protein valve to increase the caffeine kick! Flushed the line clean. Real black roast is brewing again in Engineering Deck 2 if you want a mug.',
    category: 'personal',
  },
  {
    officer: 'Jax',
    title: 'Nanite Swarm Maintenance Cycle',
    hook: 'Jax is watching the hull nanite repair drones recalibrate.',
    snippet: 'Running a calibration cycle on the nanite repair hive. Those little micro-welders work miracles when things get rough.',
    promptSuggestion: 'Jax, how are our hull nanite repair reserves holding up?',
    dialogueResponse: 'Nanite hive is fully synchronized, Cap! Micro-lathes are sharp and the carbon feedstock is primed. If anything dings our armor plating, we can seal punctures in seconds flat.',
    category: 'engineering',
  },
  {
    officer: 'Jax',
    title: 'Old Sirius Run Reminiscence',
    hook: 'Jax is reminiscing about past starship escapades.',
    snippet: 'These thermal baffles take a beating. Reminds me of the old Sirius ice-mining convoy back in \'84.',
    promptSuggestion: 'Jax, what happened during that Sirius ice-mining convoy?',
    dialogueResponse: 'Oh boy. We lost two reaction thrusters inside a cryo-cloud and had to slingshot around a frozen moon with nothing but RCS chemical puffs and sheer stubbornness. The Aegis here is a luxury liner compared to that rust bucket!',
    category: 'lore',
  },
  {
    officer: 'Jax',
    title: 'Spacers\' Superstitions & B-Flat Hum',
    hook: 'Jax is checking the deck plate magnetic dampeners.',
    snippet: 'Old spacer tales say if your grav-plates hum in B-flat, you\'re kissing an uncharted gravity well.',
    promptSuggestion: 'Jax, is there any truth to that spacer superstition about the grav-plates?',
    dialogueResponse: 'Between you and me, Captain? 99% of the time it\'s just loose mounting rivets! But once in the Perseus rift, that B-flat hum warned us three seconds before a micro-singularity opened. Keep your ears open regardless!',
    category: 'lore',
  },
  {
    officer: 'Jax',
    title: 'Manifold Flow Rate Optimization',
    hook: 'Jax squeezed a minor efficiency boost from the plasma injectors.',
    snippet: 'Just tuned the sub-light fuel injection curve. Squeezed an extra 3% flow efficiency out of the manifold.',
    promptSuggestion: 'Jax, report on that manifold fuel injection tweak.',
    dialogueResponse: 'Plasma burn is cleaner, Cap! Combustion exhaust temp dropped twelve degrees, and we\'re sipping slightly less auxiliary juice per sub-light burst. She\'s purring like a star-lion.',
    category: 'engineering',
  },
  {
    officer: 'Jax',
    title: 'Plasma Torch Calibration Technique',
    hook: 'Jax is polishing an old handheld magnetic cutting rig.',
    snippet: 'Automated nanites are great, but nothing beats a handheld magnetic plasma torch when conduits blow.',
    promptSuggestion: 'Jax, do you still do manual welding out there?',
    dialogueResponse: 'Always, Cap. Drones can glitch when ion storms flare up, but an old spacer with a calibrated plasma torch and magnetic boots will fix a warp seal in hard vacuum every single time. Muscle memory never fails.',
    category: 'personal',
  },
  {
    officer: 'Jax',
    title: 'Hull Kinetic Stress Micro-Fractures',
    hook: 'Jax is watching armor integrity telemetry nervously.',
    snippet: 'Outer hull is taking micro-pitting from interstellar dust. We should keep repair drones on hot standby.',
    promptSuggestion: 'Jax, give me your thoughts on our outer hull wear and tear.',
    dialogueResponse: 'Armor plating is holding, but the micrometeorite scour is real out here. I\'ve got nanite canisters pre-warmed in bay 3 so we can flash-weld any breeches the moment trouble hits.',
    category: 'engineering',
    conditions: { maxHull: 75 },
  },
  {
    officer: 'Jax',
    title: 'Manifold Thermals at Warp Throttle',
    hook: 'Jax is monitoring reactor core temperature gauges.',
    snippet: 'Injectors are glowing cherry-red! Love the speed, Cap, but don\'t forget the heat sinks!',
    promptSuggestion: 'Jax, can the manifolds take this sustained throttle?',
    dialogueResponse: 'She\'ll take whatever we throw at her, Captain! Just keep an eye on that capacitor drain. As long as the liquid helium lines don\'t boil, I\'ll keep the flame roaring!',
    category: 'engineering',
    conditions: { minSpeed: 4 },
  },

  // ELARA TOPICS - ASTROMETRICS, QUANTUM PHENOMENA & OBSERVATION
  {
    officer: 'Elara',
    title: 'Cherenkov Radiation Micro-Echoes',
    hook: 'Elara isolated an anomaly in the subspace sensor array.',
    snippet: 'Forward telemetry isolated faint Cherenkov radiation harmonics. Highly intriguing cosmic background resonance.',
    promptSuggestion: 'Elara, explain those Cherenkov radiation harmonics you detected.',
    dialogueResponse: 'Fascinating signatures, Captain. The radiation suggests tachyon particles traveling faster than local phase velocity through interstellar dark matter filaments. No navigational hazard, but the data will revolutionize our astrometric telemetry charts.',
    category: 'science',
  },
  {
    officer: 'Elara',
    title: 'Sector Null Redshift Anomaly',
    hook: 'Elara is analyzing spectral shifts from distant stars.',
    snippet: 'The Doppler redshift in this sector diverges from standard Hubble cosmological models by 0.042%.',
    promptSuggestion: 'Elara, what does the redshift divergence in Sector Null mean?',
    dialogueResponse: 'It implies local spacetime curvature is being gently perturbed by a massive, non-baryonic gravitational structure far beyond visual horizon. We are sailing into a truly unprecedented cosmological anomaly.',
    category: 'science',
  },
  {
    officer: 'Elara',
    title: 'Rhythmic Subspace Pulsar Signals',
    hook: 'Elara decoded a periodic pulse from a distant beacon.',
    snippet: 'Sensor telemetry is registering micro-pulses from 12 parsecs out. Periodicity: precisely 1.414 seconds.',
    promptSuggestion: 'Elara, have you identified the source of that 1.414-second subspace signal?',
    dialogueResponse: 'Signal correlation confirms an ancient magnetar emitting synchrotron radiation through a spinning accretion disk. Its mathematical ratio matches the square root of two—nature\'s own radio metronome, Captain.',
    category: 'observation',
  },
  {
    officer: 'Elara',
    title: 'Micro-Gravitational Lensing Ripple',
    hook: 'Elara detected optical warping along our flight corridor.',
    snippet: 'Forward view exhibits micro-lensing. Starlight behind us is bending 3 arcseconds along our vector.',
    promptSuggestion: 'Elara, what is causing the starlight bending on our flight path?',
    dialogueResponse: 'A localized quantum foam ripple. Harmless to our hull, but it refracts stellar photons into kaleidoscopic rings. I have routed the visual spectrum filter to the main viewport for your observation.',
    category: 'science',
  },
  {
    officer: 'Elara',
    title: 'Quantum Chronometer Drift',
    hook: 'Elara noticed atomic clock variations relative to local vacuum.',
    snippet: 'Our cesium atomic chronometers are registering a 4-microsecond drift per light-year traversed in Sector Null.',
    promptSuggestion: 'Elara, is the chronometer drift affecting our navigational sync?',
    dialogueResponse: 'Subspace time-stamping algorithms have compensated for the temporal shear. It is an extraordinary testament to the density of the chroniton field in this sector. Our perceived reality remains synchronistic.',
    category: 'science',
  },
  {
    officer: 'Elara',
    title: 'Uncharted Sector Astrometry',
    hook: 'Elara is reviewing stellar survey archives.',
    snippet: 'According to Coalition archives, no exploratory ship has logged coordinates in this quadrant for sixty standard years.',
    promptSuggestion: 'Elara, what do historical logs say about the last ship through Sector Null?',
    dialogueResponse: 'The survey vessel U.S.S. Pathfinder transmitted its final automated beacon 62 years ago, noting "mirrors in the starlight" before entering deep warp. We are walking in the footsteps of legends, Captain.',
    category: 'lore',
  },
  {
    officer: 'Elara',
    title: 'Interstellar Gas Cloud Composition',
    hook: 'Elara sampled ambient nebular matter outside the hull.',
    snippet: 'Atmospheric sensors indicate ambient interstellar medium consists of 88% ionized hydrogen and traces of lithium.',
    promptSuggestion: 'Elara, can we utilize the ambient gas cloud for auxiliary collection?',
    dialogueResponse: 'Affirmative, Captain. Photovoltaic scoops can siphon trace ions during standard sub-light cruise, providing clean auxiliary recharge to our battery banks.',
    category: 'science',
  },
  {
    officer: 'Elara',
    title: 'Relativistic Time Dilation Curvature',
    hook: 'Elara is tracking Lorentz contraction at current throttle.',
    snippet: 'At this velocity, relativistic contraction compresses forward light into soft blue Cherenkov emissions.',
    promptSuggestion: 'Elara, report on relativistic particle effects at this speed.',
    dialogueResponse: 'Particle drag against our forward deflector generates a pleasant ionic luminescence. Shield geometry is deflecting 99.98% of relativistic protons. Safe and mathematically elegant.',
    category: 'science',
    conditions: { minSpeed: 4 },
  },
  {
    officer: 'Elara',
    title: 'Hazard Perimeter Telemetry',
    hook: 'Elara is running spectrographic sweeps on the active contact.',
    snippet: 'The current contact exhibits localized tachyon eddy currents. Energy output is fluctuating non-linearly.',
    promptSuggestion: 'Elara, what can you glean from the active hazard\'s tachyon telemetry?',
    dialogueResponse: 'The phenomenon\'s energy spikes are phase-locked with local dark matter gradients. By monitoring its oscillation cycle, we can predict safe navigation windows with 94.7% accuracy.',
    category: 'science',
    conditions: { requiresEncounter: true },
  },
];

/**
 * Selects an appropriate idle conversation topic based on current ship telemetry,
 * crew statuses, and history of previously selected topic titles.
 */
export function getNextIdleTopic(
  ship: ShipState,
  crew: CrewStatus,
  encounter: Encounter | null,
  recentTopicTitles: string[] = []
): IdleTopic | null {
  const eligible = IDLE_TOPIC_POOL.filter((item) => {
    // Avoid repeating recently used topics if possible
    if (recentTopicTitles.includes(item.title) && recentTopicTitles.length < IDLE_TOPIC_POOL.length - 2) {
      return false;
    }

    if (item.conditions) {
      const cond = item.conditions;
      if (cond.minHull !== undefined && ship.hull < cond.minHull) return false;
      if (cond.maxHull !== undefined && ship.hull > cond.maxHull) return false;
      if (cond.minSpeed !== undefined && ship.speed < cond.minSpeed) return false;
      if (cond.maxSpeed !== undefined && ship.speed > cond.maxSpeed) return false;
      if (cond.requiresEncounter && !encounter) return false;
      if (cond.requiresNoEncounter && encounter) return false;
      if (cond.minStress !== undefined) {
        const stress = item.officer === 'Jax' ? crew.jaxStress : crew.elaraStress ?? 12;
        if (stress < cond.minStress) return false;
      }
      if (cond.maxStress !== undefined) {
        const stress = item.officer === 'Jax' ? crew.jaxStress : crew.elaraStress ?? 12;
        if (stress > cond.maxStress) return false;
      }
    }

    return true;
  });

  if (eligible.length === 0) {
    // Fallback: pick any from the pool without conditions
    const fallbackList = IDLE_TOPIC_POOL.filter((t) => !t.conditions?.requiresEncounter || encounter);
    const chosen = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    return {
      ...chosen,
      id: `idle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      availableAt: Date.now(),
    };
  }

  // Alternate or select based on officer states (e.g. higher curiosity -> Elara, higher stress/engineering interest -> Jax)
  const chosen = eligible[Math.floor(Math.random() * eligible.length)];
  return {
    ...chosen,
    id: `idle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    availableAt: Date.now(),
  };
}

/**
 * Checks if a given user command matches an idle topic so the simulated engine
 * can provide the rich, custom-written lore dialogue.
 */
export function findMatchingIdleTopicResponse(command: string): { officer: 'Jax' | 'Elara'; text: string; topic: typeof IDLE_TOPIC_POOL[0] } | null {
  const lower = command.toLowerCase().trim();

  for (const topic of IDLE_TOPIC_POOL) {
    const promptLower = topic.promptSuggestion.toLowerCase();
    const titleLower = topic.title.toLowerCase();

    // Key phrase extraction
    if (
      lower.includes(promptLower) ||
      promptLower.includes(lower) ||
      (topic.title === 'Conduit 7 Harmonic Resonances' && (lower.includes('conduit 7') || lower.includes('420 hz') || lower.includes('coil vibration'))) ||
      (topic.title === 'Galley Coffee Synthesizer Glitch' && (lower.includes('coffee') || lower.includes('galley'))) ||
      (topic.title === 'Nanite Swarm Maintenance Cycle' && (lower.includes('nanite repair') || lower.includes('nanite reserves') || lower.includes('nanite hive'))) ||
      (topic.title === 'Old Sirius Run Reminiscence' && (lower.includes('sirius') || lower.includes('ice-mining'))) ||
      (topic.title === 'Spacers\' Superstitions & B-Flat Hum' && (lower.includes('b-flat') || lower.includes('superstition') || lower.includes('grav-plate'))) ||
      (topic.title === 'Manifold Flow Rate Optimization' && (lower.includes('flow rate') || lower.includes('manifold fuel') || lower.includes('injection tweak'))) ||
      (topic.title === 'Plasma Torch Calibration Technique' && (lower.includes('plasma torch') || lower.includes('manual welding'))) ||
      (topic.title === 'Cherenkov Radiation Micro-Echoes' && (lower.includes('cherenkov') || lower.includes('radiation harmonics'))) ||
      (topic.title === 'Sector Null Redshift Anomaly' && (lower.includes('redshift') || lower.includes('hubble'))) ||
      (topic.title === 'Rhythmic Subspace Pulsar Signals' && (lower.includes('1.414') || lower.includes('pulsar signal') || lower.includes('subspace signal'))) ||
      (topic.title === 'Micro-Gravitational Lensing Ripple' && (lower.includes('lensing') || lower.includes('starlight bending') || lower.includes('quantum foam'))) ||
      (topic.title === 'Quantum Chronometer Drift' && (lower.includes('chronometer') || lower.includes('drift') || lower.includes('atomic clock'))) ||
      (topic.title === 'Uncharted Sector Astrometry' && (lower.includes('pathfinder') || lower.includes('last ship') || lower.includes('sixty standard years') || lower.includes('historical logs'))) ||
      (topic.title === 'Interstellar Gas Cloud Composition' && (lower.includes('gas cloud') || lower.includes('ionized hydrogen'))) ||
      (topic.title === 'Relativistic Time Dilation Curvature' && (lower.includes('relativistic') || lower.includes('dilation'))) ||
      (topic.title === 'Hazard Perimeter Telemetry' && (lower.includes('tachyon telemetry') || lower.includes('hazard\'s tachyon') || lower.includes('perimeter telemetry')))
    ) {
      return {
        officer: topic.officer,
        text: topic.dialogueResponse,
        topic,
      };
    }
  }

  return null;
}
