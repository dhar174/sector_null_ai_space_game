import React, { useState, useEffect, useRef } from 'react';
import { ShipState, CrewStatus, Encounter, CommsMessage, SettingsState, IdleTopic } from './types';
import { ViewportCanvas } from './components/ViewportCanvas';
import { ShipStatus } from './components/ShipStatus';
import { CommsFeed } from './components/CommsFeed';
import { CommandConsole } from './components/CommandConsole';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { IdleTopicToast } from './components/IdleTopicToast';
import { SpaceRenderer } from './game/starfield';
import { generateRandomEncounter } from './game/encounters';
import { getNextIdleTopic } from './game/idleTopics';
import {
  sendCrewCommand,
  triggerCriticalHullDialogue,
  triggerHullStabilizedDialogue,
  getCriticalHullHitResponse,
  shouldTriggerCriticalHullAlert,
} from './game/crewAI';
import { sound } from './utils/audio';
import { Rocket, Shield, Radio, Sparkles, Users, MessageSquare } from 'lucide-react';
import { OfficerDossierModal, CharacterType, JaxPortrait, ElaraPortrait } from './components/CrewPortraits';

const INITIAL_SHIP_STATE: ShipState = {
  hull: 100,
  energy: 100,
  speed: 2,
  shields: 60,
  distance: 0,
  sector: 'Sector Null - Outer Verge',
  sectorLevel: 1,
  isGameOver: false,
};

const INITIAL_CREW_STATUS: CrewStatus = {
  jaxStress: 15,
  jaxStatus: 'Nominal',
  elaraStress: 12,
  elaraCuriosity: 30,
  elaraStatus: 'Analytical',
};

const STORAGE_SETTINGS_KEY = 'sector_null_settings_v1';

export default function App() {
  const [ship, setShip] = useState<ShipState>(INITIAL_SHIP_STATE);
  const [crew, setCrew] = useState<CrewStatus>(INITIAL_CREW_STATUS);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [messages, setMessages] = useState<CommsMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [encountersCount, setEncountersCount] = useState<number>(0);
  const [dossierOfficer, setDossierOfficer] = useState<CharacterType | null>(null);

  // Idle crew conversation topics system
  const [activeIdleTopic, setActiveIdleTopic] = useState<IdleTopic | null>(null);
  const [showIdleToast, setShowIdleToast] = useState<boolean>(false);
  const hasActiveIdleTopicRef = useRef<boolean>(false);
  const lastUserActivityRef = useRef<number>(Date.now());
  const recentIdleTopicsRef = useRef<string[]>([]);
  const nextIdleCheckTimeRef = useRef<number>(Date.now() + 18000); // 18s initial grace period

  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      provider: 'gemini',
      customGeminiKey: '',
      customOpenAiKey: '',
      model: 'gemini-3.8-flash',
      soundEnabled: true,
    };
  });

  const rendererRef = useRef<SpaceRenderer | null>(null);
  const nextEncounterDistRef = useRef<number>(12); // First encounter spawns at ~12 LY
  const prevHullRef = useRef<number>(INITIAL_SHIP_STATE.hull);
  const criticalAlertActiveRef = useRef<boolean>(false);

  // Monitor critical hull condition (< 20%) to trigger urgent bridge dialogue, alarms, and comms alerts
  useEffect(() => {
    if (ship.isGameOver) return;

    const prev = prevHullRef.current;
    const curr = ship.hull;

    // Detect transition when hull falls below 20%
    if (shouldTriggerCriticalHullAlert(curr, prev)) {
      criticalAlertActiveRef.current = true;
      sound.playKlaxon();
      rendererRef.current?.triggerShake(16);

      // Spike crew stress when hull integrity breaks below 20%
      setCrew((c) => ({
        ...c,
        jaxStress: Math.min(100, c.jaxStress + 28),
        jaxStatus: 'Panicking',
        elaraStress: Math.min(100, (c.elaraStress ?? 12) + 20),
        elaraStatus: 'Alarmed',
      }));

      // Generate urgent bridge officer responses
      const urgentDialogue = triggerCriticalHullDialogue(ship, crew, encounter);
      urgentDialogue.forEach((alertMsg, idx) => {
        setTimeout(() => {
          sound.playTransmissionIn(alertMsg.speaker);
          setMessages((prevMsgs) => [...prevMsgs, alertMsg]);
        }, idx * 450);
      });
    } else if (prev < 20 && curr >= 20) {
      // Hull recovered back above 20%
      if (criticalAlertActiveRef.current) {
        criticalAlertActiveRef.current = false;
        sound.playScan();
        const stabilizedDialogue = triggerHullStabilizedDialogue(ship, crew);
        stabilizedDialogue.forEach((stabMsg, idx) => {
          setTimeout(() => {
            sound.playTransmissionIn(stabMsg.speaker);
            setMessages((prevMsgs) => [...prevMsgs, stabMsg]);
          }, idx * 400);
        });
      }
    }

    prevHullRef.current = curr;
  }, [ship.hull, ship.isGameOver, crew, encounter]);

  // Sync sound engine enabled state
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Initial welcome and crew orientation messages on mount
  useEffect(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages([
      {
        id: 'init-1',
        speaker: 'Ship AI',
        text: 'Main reactor online. Navigation computers locked on Sector Null coordinates. Sub-light thrusters operating at cruise Speed 2.',
        timestamp: time,
      },
      {
        id: 'init-2',
        speaker: 'Jax',
        text: 'Captain, starboard coolant lines are already vibrating. Keep an eye on that throttle and don\'t burn out my coils!',
        timestamp: time,
      },
      {
        id: 'init-3',
        speaker: 'Elara',
        text: 'Sensors recalibrated. Ambient cosmic radiation in this sector is highly anomalous... fascinating. Awaiting your operational orders, Captain.',
        timestamp: time,
      },
    ]);
  }, []);

  // Main Real-Time Game Loop Tick (every 1 second)
  useEffect(() => {
    if (ship.isGameOver) return;

    const interval = setInterval(() => {
      setShip((prevShip) => {
        if (prevShip.isGameOver) return prevShip;

        let newDist = prevShip.distance;
        let newEnergy = prevShip.energy;
        let newHull = prevShip.hull;
        let newShields = prevShip.shields;
        let newSector = prevShip.sector;
        let newLevel = prevShip.sectorLevel;

        // 1. Advance distance proportional to speed
        if (prevShip.speed > 0) {
          const distDelta = prevShip.speed * 0.12;
          newDist += distDelta;

          // Natural idle energy burn
          const energyDrain = prevShip.speed * 0.3;
          newEnergy = Math.max(0, newEnergy - energyDrain);
        }

        // 2. Sector advancement every 40 LY
        const calculatedLevel = Math.floor(newDist / 40) + 1;
        if (calculatedLevel !== newLevel) {
          newLevel = calculatedLevel;
          if (newLevel === 2) newSector = 'Sector Null - Remnant Void';
          else if (newLevel === 3) newSector = 'Sector Null - Tachyon Abyss';
          else if (newLevel >= 4) newSector = 'Sector Null - Deep Core Singularity';

          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages((msgs) => [
            ...msgs,
            {
              id: `sec-${Date.now()}`,
              speaker: 'Ship AI',
              text: `SECTOR TRANSITION: Entering ${newSector} (Hazard Level ${newLevel}). Deflector frequency updated.`,
              timestamp: time,
            },
          ]);
        }

        // 3. Check for encounter spawn if none active
        if (!encounter && newDist >= nextEncounterDistRef.current) {
          const newEnc = generateRandomEncounter(newLevel);
          setEncounter(newEnc);
          nextEncounterDistRef.current = newDist + 15 + Math.floor(Math.random() * 15);
          sound.playKlaxon();

          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages((msgs) => [
            ...msgs,
            {
              id: `enc-alert-${Date.now()}`,
              speaker: 'Ship AI',
              text: `PROXIMITY WARNING: ${newEnc.title.toUpperCase()} detected on forward vector! Clearance required: ${newEnc.distanceRemaining} km.`,
              timestamp: time,
            },
          ]);
        }

        return {
          ...prevShip,
          distance: newDist,
          energy: newEnergy,
          hull: newHull,
          shields: newShields,
          sector: newSector,
          sectorLevel: newLevel,
        };
      });

      // 4. Update encounter state
      setEncounter((prevEnc) => {
        if (!prevEnc || !prevEnc.active) return prevEnc;

        // If ship has speed, we traverse the hazard
        const speedFactor = Math.max(0.5, ship.speed);
        const remaining = prevEnc.distanceRemaining - (speedFactor * 1.8);

        // Natural hazard effects while traversing
        if (prevEnc.type === 'asteroid_field' && ship.speed >= 3 && Math.random() < 0.25) {
          // Debris impact scrape!
          if (ship.shields > 0) {
            setShip((s) => ({ ...s, shields: Math.max(0, s.shields - 8) }));
            sound.playTransmissionIn('Ship AI');
            rendererRef.current?.triggerShake(4);
          } else {
            setShip((s) => {
              const damaged = Math.max(0, s.hull - 7);
              if (s.hull < 20 && damaged > 0) {
                const hitMsg = getCriticalHullHitResponse(damaged, 7, prevEnc.title);
                setTimeout(() => {
                  sound.playTransmissionIn('Jax');
                  setMessages((msgs) => [...msgs, hitMsg]);
                }, 200);
              }
              return {
                ...s,
                hull: damaged,
                isGameOver: damaged <= 0,
                gameOverReason: `Catastrophic collision inside ${prevEnc.title}`,
              };
            });
            sound.playImpact();
            rendererRef.current?.triggerShake(12);
          }
        } else if (prevEnc.type === 'ion_storm') {
          // Additional energy drain in ion storm
          setShip((s) => ({ ...s, energy: Math.max(0, s.energy - 0.8) }));
        }

        // Encounter successfully cleared!
        if (remaining <= 0) {
          sound.playCommsChirp(920);
          setEncountersCount((c) => c + 1);
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages((msgs) => [
            ...msgs,
            {
              id: `clear-${Date.now()}`,
              speaker: 'Elara',
              text: `Hazard zone cleared. We have left the boundary of the ${prevEnc.title}. Normal flight corridor resumed.`,
              timestamp: time,
            },
            {
              id: `clear-jax-${Date.now()}`,
              speaker: 'Jax',
              text: 'Glad that\'s over. My manifold heat was hitting the red zone! Good flying, everyone.',
              timestamp: time,
            },
          ]);
          return null;
        }

        return {
          ...prevEnc,
          distanceRemaining: remaining,
        };
      });

      // 5. Update crew emotional states dynamically
      setCrew((prevCrew) => {
        let jaxStress = prevCrew.jaxStress;
        let elaraStress = prevCrew.elaraStress ?? 12;
        let elaraCuriosity = prevCrew.elaraCuriosity;

        // If hull low, speed 5, or taking heavy hits, Jax stress climbs
        if (ship.hull < 50) jaxStress = Math.min(100, jaxStress + 2);
        else if (ship.speed === 5) jaxStress = Math.min(100, jaxStress + 1);
        else jaxStress = Math.max(10, jaxStress - 0.5);

        // Elara stress climbs under extreme danger, collapsed shields, or hull breaches
        if (encounter && encounter.dangerLevel === 'Extreme') elaraStress = Math.min(100, elaraStress + 1.8);
        else if (ship.shields < 20 && encounter) elaraStress = Math.min(100, elaraStress + 1.2);
        else if (ship.hull < 40) elaraStress = Math.min(100, elaraStress + 1.2);
        else elaraStress = Math.max(8, elaraStress - 0.5);

        // If encounter active, Elara curiosity peaks
        if (encounter) elaraCuriosity = Math.min(100, elaraCuriosity + 2);
        else elaraCuriosity = Math.max(20, elaraCuriosity - 0.8);

        const jaxStatus =
          jaxStress > 70 ? 'Panicking' : jaxStress > 40 ? 'Stressed' : 'Nominal';
        const elaraStatus =
          elaraStress > 65
            ? 'Alarmed'
            : elaraCuriosity > 75
            ? 'Fascinated'
            : elaraCuriosity > 45
            ? 'Intrigued'
            : 'Analytical';

        return {
          jaxStress: Math.round(jaxStress),
          jaxStatus,
          elaraStress: Math.round(elaraStress),
          elaraCuriosity: Math.round(elaraCuriosity),
          elaraStatus,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ship.isGameOver, ship.speed, ship.hull, ship.shields, encounter]);

  // Track user activity when captain types or transmits
  const handleUserActive = () => {
    lastUserActivityRef.current = Date.now();
  };

  // Triggers generation of a new context-aware idle conversation topic
  const triggerNewIdleTopic = (force: boolean = false) => {
    if (ship.isGameOver) return;
    const nextTopic = getNextIdleTopic(ship, crew, encounter, recentIdleTopicsRef.current);
    if (nextTopic) {
      recentIdleTopicsRef.current = [...recentIdleTopicsRef.current.slice(-6), nextTopic.title];
      hasActiveIdleTopicRef.current = true;
      setActiveIdleTopic(nextTopic);
      setShowIdleToast(true);
      sound.playIdleChirp(nextTopic.officer);
      nextIdleCheckTimeRef.current = Date.now() + 32000;
    }
  };

  // Select and discuss an idle topic
  const handleSelectIdleTopic = (topic: IdleTopic) => {
    lastUserActivityRef.current = Date.now();
    nextIdleCheckTimeRef.current = Date.now() + 28000;
    setShowIdleToast(false);
    hasActiveIdleTopicRef.current = false;
    setActiveIdleTopic(null);

    // Crew bonding effect: slight stress relief for Jax, curiosity boost for Elara
    setCrew((prev) => ({
      ...prev,
      jaxStress: topic.officer === 'Jax' ? Math.max(8, prev.jaxStress - 6) : prev.jaxStress,
      elaraCuriosity: topic.officer === 'Elara' ? Math.min(100, prev.elaraCuriosity + 8) : prev.elaraCuriosity,
      elaraStress: topic.officer === 'Elara' ? Math.max(6, (prev.elaraStress ?? 12) - 4) : prev.elaraStress,
    }));

    handleSendCommand(topic.promptSuggestion);
  };

  const handleDismissIdleToast = () => {
    setShowIdleToast(false);
    // Topic remains active in UI badges for captain to discuss when ready
  };

  // Dedicated Idle Chatter detector loop:
  // When captain has not sent messages for >= 18 seconds, an officer raises a thought
  useEffect(() => {
    if (ship.isGameOver) return;

    const idleTimer = setInterval(() => {
      const now = Date.now();
      const idleDuration = now - lastUserActivityRef.current;

      if (
        !hasActiveIdleTopicRef.current &&
        !isLoading &&
        now >= nextIdleCheckTimeRef.current &&
        idleDuration >= 18000
      ) {
        triggerNewIdleTopic();
      }
    }, 2000);

    return () => clearInterval(idleTimer);
  }, [ship, crew, encounter, isLoading]);

  // Handle Player Command execution
  const handleSendCommand = async (commandText: string) => {
    if (ship.isGameOver || isLoading) return;

    sound.playCommsChirp(600);
    setIsLoading(true);
    setOrdersCount((c) => c + 1);

    // Reset idle tracking timer
    lastUserActivityRef.current = Date.now();
    nextIdleCheckTimeRef.current = Date.now() + 26000;
    hasActiveIdleTopicRef.current = false;
    setActiveIdleTopic(null);
    setShowIdleToast(false);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add Captain's order to feed
    setMessages((prev) => [
      ...prev,
      {
        id: `capt-${Date.now()}`,
        speaker: 'Captain',
        text: commandText,
        timestamp: time,
      },
    ]);

    try {
      // 2. Call LLM crew pipeline or simulation engine
      const response = await sendCrewCommand(
        commandText,
        ship,
        crew,
        encounter,
        messages.map((m) => ({ speaker: m.speaker, text: m.text })),
        settings
      );

      // 3. Play sound & add crew dialogue to feed
      if (response.dialogue && response.dialogue.length > 0) {
        response.dialogue.forEach((line, index) => {
          setTimeout(() => {
            sound.playTransmissionIn(line.speaker);
            setMessages((prev) => [
              ...prev,
              {
                id: `crew-${Date.now()}-${index}`,
                speaker: line.speaker,
                text: line.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }, index * 400);
        });
      }

      // 4. Apply actionable JSON state changes to ship
      if (response.actions && Array.isArray(response.actions)) {
        setShip((prev) => {
          let updatedHull = prev.hull;
          let updatedEnergy = prev.energy;
          let updatedSpeed = prev.speed;
          let updatedShields = prev.shields;

          for (const action of response.actions) {
            switch (action.type) {
              case 'change_speed':
                updatedSpeed = Math.max(0, Math.min(5, updatedSpeed + action.value));
                sound.playThrottle();
                break;
              case 'change_energy':
                updatedEnergy = Math.max(0, Math.min(100, updatedEnergy + action.value));
                break;
              case 'change_hull':
                updatedHull = Math.max(0, Math.min(100, updatedHull + action.value));
                if (action.value > 0) {
                  rendererRef.current?.addRepairSparks(
                    (rendererRef.current as any).canvas?.width / 2 || 400,
                    (rendererRef.current as any).canvas?.height * 0.72 || 350
                  );
                }
                break;
              case 'change_shields':
                updatedShields = Math.max(0, Math.min(100, updatedShields + action.value));
                break;
              case 'scan_anomaly':
                rendererRef.current?.triggerScan();
                sound.playScan();
                setEncounter((e) => (e ? { ...e, scanned: true } : null));
                break;
              case 'evasive_burn':
                rendererRef.current?.triggerShake(8);
                sound.playThrottle();
                setEncounter((e) =>
                  e ? { ...e, distanceRemaining: Math.max(0, e.distanceRemaining - 15) } : null
                );
                break;
              default:
                break;
            }
          }

          const isDead = updatedHull <= 0;
          if (isDead) {
            sound.playImpact();
          }

          return {
            ...prev,
            hull: updatedHull,
            energy: updatedEnergy,
            speed: updatedSpeed,
            shields: updatedShields,
            isGameOver: isDead,
            gameOverReason: isDead ? 'Hull breached following critical system overload' : prev.gameOverReason,
          };
        });
      }
    } catch (err) {
      console.error('Failed to process crew command:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartGame = () => {
    setShip(INITIAL_SHIP_STATE);
    setCrew(INITIAL_CREW_STATUS);
    setEncounter(null);
    setOrdersCount(0);
    setEncountersCount(0);
    nextEncounterDistRef.current = 12;
    hasActiveIdleTopicRef.current = false;
    setActiveIdleTopic(null);
    setShowIdleToast(false);
    lastUserActivityRef.current = Date.now();
    nextIdleCheckTimeRef.current = Date.now() + 20000;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: `reboot-${Date.now()}`,
        speaker: 'Ship AI',
        text: 'STARSHIP SYSTEMS REBOOTED. Hull integrity restored to 100%. Main thrusters engaging.',
        timestamp: time,
      },
      {
        id: `reboot-jax-${Date.now()}`,
        speaker: 'Jax',
        text: 'Phew! Back from the brink! Let\'s not get blown up this time, Cap!',
        timestamp: time,
      },
      {
        id: `reboot-elara-${Date.now()}`,
        speaker: 'Elara',
        text: 'Sensors re-aligned to Sector Null coordinates. Standing by for telemetry.',
        timestamp: time,
      },
    ]);
  };

  return (
    <div className="w-screen h-screen bg-[#050811] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Top Application Bar */}
      <header className="h-11 shrink-0 bg-[#070b16] border-b border-cyan-900/40 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/50">
            <Rocket className="w-3.5 h-3.5 transform -rotate-45" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold font-display uppercase tracking-widest text-slate-100">
              Sector Null
            </h1>
            <span className="text-[10px] font-terminal text-cyan-400/80 hidden sm:inline">
              // 2D AI CREW SURVIVAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-terminal">
          {/* Quick Header Officer Telemetry Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            {/* Jax Quick Inspector */}
            <button
              onClick={() => setDossierOfficer('Jax')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer group"
              title="Inspect Chief Engineer Jax"
            >
              <JaxPortrait
                stress={crew.jaxStress}
                status={crew.jaxStatus}
                size={22}
                interactive={false}
                hasIdleTopic={activeIdleTopic?.officer === 'Jax'}
                idleTopicSnippet={activeIdleTopic?.officer === 'Jax' ? activeIdleTopic.title : undefined}
              />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-amber-300 leading-none group-hover:text-amber-200 flex items-center gap-1">
                  <span>JAX</span>
                  {activeIdleTopic?.officer === 'Jax' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" title="Idle topic available" />
                  )}
                </span>
                <span className={`text-[8px] font-mono leading-none ${
                  crew.jaxStress > 70 ? 'text-rose-400 font-bold' : crew.jaxStress > 35 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {crew.jaxStatus} ({crew.jaxStress}%)
                </span>
              </div>
            </button>

            <span className="h-4 w-[1px] bg-slate-800" />

            {/* Elara Quick Inspector */}
            <button
              onClick={() => setDossierOfficer('Elara')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer group"
              title="Inspect Science Officer Elara"
            >
              <ElaraPortrait
                stress={crew.elaraStress ?? 12}
                curiosity={crew.elaraCuriosity}
                status={crew.elaraStatus}
                size={22}
                interactive={false}
                hasIdleTopic={activeIdleTopic?.officer === 'Elara'}
                idleTopicSnippet={activeIdleTopic?.officer === 'Elara' ? activeIdleTopic.title : undefined}
              />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-cyan-300 leading-none group-hover:text-cyan-200 flex items-center gap-1">
                  <span>ELARA</span>
                  {activeIdleTopic?.officer === 'Elara' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" title="Idle topic available" />
                  )}
                </span>
                <span className={`text-[8px] font-mono leading-none ${
                  (crew.elaraStress ?? 12) > 65 ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}>
                  {crew.elaraStatus} ({crew.elaraStress ?? 12}%)
                </span>
              </div>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px]">
              AI CREW: <strong className="text-cyan-300">{settings.provider.toUpperCase()}</strong>
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/50 text-cyan-300 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>SETTINGS</span>
          </button>
        </div>
      </header>

      {/* Main 4-Quadrant Sci-Fi Bridge Cockpit Layout */}
      <main className="flex-1 min-h-0 p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-12 grid-rows-12 gap-2 sm:gap-3">
        {/* Quadrant 1: Main Viewport Canvas (Top Left - 60% / 7 cols) */}
        <div className="lg:col-span-7 row-span-7 h-full min-h-0">
          <ViewportCanvas
            ship={ship}
            encounter={encounter}
            rendererRef={rendererRef}
          />
        </div>

        {/* Quadrant 2: Ship Status & Crew Telemetry (Top Right - 40% / 5 cols) */}
        <div className="lg:col-span-5 row-span-7 h-full min-h-0">
          <ShipStatus
            ship={ship}
            crew={crew}
            encounter={encounter}
            onInspectOfficer={setDossierOfficer}
            onSendCommand={handleSendCommand}
            activeIdleTopic={activeIdleTopic}
            onSelectIdleTopic={handleSelectIdleTopic}
          />
        </div>

        {/* Quadrant 3: Tactical Bridge Comms Feed (Bottom Left - 60% / 7 cols) */}
        <div className="lg:col-span-7 row-span-5 h-full min-h-0">
          <CommsFeed
            messages={messages}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
            onClearMessages={() => setMessages([])}
            hull={ship.hull}
            crew={crew}
            onInspectOfficer={setDossierOfficer}
            activeIdleTopic={activeIdleTopic}
            onSelectIdleTopic={handleSelectIdleTopic}
          />
        </div>

        {/* Quadrant 4: Captain Command Console (Bottom Right - 40% / 5 cols) */}
        <div className="lg:col-span-5 row-span-5 h-full min-h-0">
          <CommandConsole
            onSendCommand={handleSendCommand}
            isLoading={isLoading}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isHullCritical={ship.hull < 20 && ship.hull > 0}
            activeIdleTopic={activeIdleTopic}
            onSelectIdleTopic={handleSelectIdleTopic}
            onUserActive={handleUserActive}
            onTriggerIdleTopicTest={() => triggerNewIdleTopic(true)}
          />
        </div>
      </main>

      {/* Floating Subtle Idle Conversation Topic Toast Notification */}
      {showIdleToast && activeIdleTopic && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 max-w-sm sm:max-w-md w-full px-3 pointer-events-auto">
          <IdleTopicToast
            topic={activeIdleTopic}
            crew={crew}
            onSelectTopic={handleSelectIdleTopic}
            onDismiss={handleDismissIdleToast}
          />
        </div>
      )}

      {/* Central Officer Dossier & Biometrics Inspection Modal */}
      {dossierOfficer && (
        <OfficerDossierModal
          isOpen={true}
          onClose={() => setDossierOfficer(null)}
          officer={dossierOfficer}
          crew={crew}
          onSendCommand={handleSendCommand}
          activeTopic={activeIdleTopic}
          onSelectTopic={handleSelectIdleTopic}
        />
      )}

      {/* Settings & Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onRestartGame={handleRestartGame}
      />

      {/* Game Over Modal */}
      <GameOverModal
        ship={ship}
        onRestart={handleRestartGame}
        ordersCount={ordersCount}
        encountersCount={encountersCount}
      />
    </div>
  );
}
