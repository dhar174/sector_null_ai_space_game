import React, { useState } from 'react';
import { ShipState, CrewStatus, Encounter, IdleTopic } from '../types';
import { Shield, Battery, Gauge, Activity, AlertOctagon, Radio, Info, MessageSquare, Compass, Maximize2 } from 'lucide-react';
import { JaxPortrait, ElaraPortrait, OfficerDossierModal, CharacterType } from './CrewPortraits';
import { ShipSchematics } from './ShipSchematics';

interface ShipStatusProps {
  ship: ShipState;
  crew: CrewStatus;
  encounter: Encounter | null;
  onInspectOfficer?: (officer: CharacterType) => void;
  onSendCommand?: (command: string) => void;
  activeIdleTopic?: IdleTopic | null;
  onSelectIdleTopic?: (topic: IdleTopic) => void;
  onOpenFullSchematics?: () => void;
}

export const ShipStatus: React.FC<ShipStatusProps> = ({
  ship,
  crew,
  encounter,
  onInspectOfficer,
  onSendCommand,
  activeIdleTopic,
  onSelectIdleTopic,
  onOpenFullSchematics,
}) => {
  const [internalInspect, setInternalInspect] = useState<CharacterType | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'schematics'>('telemetry');

  const handleOpenDossier = (officer: CharacterType) => {
    if (onInspectOfficer) {
      onInspectOfficer(officer);
    } else {
      setInternalInspect(officer);
    }
  };
  // Hull color logic
  const hullColor =
    ship.hull > 60
      ? 'bg-emerald-500 shadow-emerald-500/30'
      : ship.hull > 30
      ? 'bg-amber-500 shadow-amber-500/30'
      : 'bg-rose-500 shadow-rose-500/50 animate-pulse';

  const hullTextColor =
    ship.hull > 60 ? 'text-emerald-400' : ship.hull > 30 ? 'text-amber-400' : 'text-rose-400';

  // Energy color logic
  const energyColor =
    ship.energy > 40
      ? 'bg-cyan-500 shadow-cyan-500/30'
      : ship.energy > 20
      ? 'bg-amber-500 shadow-amber-500/30'
      : 'bg-rose-500 shadow-rose-500/50 animate-pulse';

  const energyTextColor =
    ship.energy > 40 ? 'text-cyan-400' : ship.energy > 20 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div
      id="ship-status-panel"
      className="flex flex-col h-full bg-[#090d16] border border-cyan-900/40 rounded-xl p-4 shadow-xl overflow-y-auto space-y-4 font-sans"
    >
      {/* Header telemetry tag & Tab switcher */}
      <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-display text-slate-100">
            Ship Telemetry & Crew
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tab switcher: TELEMETRY vs SCHEMATICS 2D */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-2 py-0.5 rounded text-[10px] font-terminal transition-colors cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-500/25 border border-cyan-500/60 text-cyan-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TELEMETRY
            </button>
            <button
              onClick={() => setActiveTab('schematics')}
              className={`px-2 py-0.5 rounded text-[10px] font-terminal transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'schematics'
                  ? 'bg-cyan-500/25 border border-cyan-500/60 text-cyan-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>SCHEMATICS</span>
            </button>
          </div>

          {onOpenFullSchematics && (
            <button
              onClick={onOpenFullSchematics}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-600 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Expand Full Schematics Overlay"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'schematics' ? (
        <div className="flex-1 min-h-0 flex flex-col pt-1">
          <ShipSchematics
            ship={ship}
            crew={crew}
            encounter={encounter}
            mode="compact"
            onSendCommand={onSendCommand}
          />
        </div>
      ) : (
        <>
          {/* Primary Resources Grid: Hull & Energy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* HULL */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-terminal flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-300" /> HULL INTEGRITY
            </span>
            <span className={`text-base font-bold font-terminal ${hullTextColor}`}>
              {Math.round(ship.hull)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full shadow-sm ${hullColor}`}
              style={{ width: `${Math.max(0, Math.min(100, ship.hull))}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-terminal">
            <span>ARMOR BULKHEAD</span>
            <span>{ship.hull < 50 ? 'WARNING: DEGRADE' : 'NOMINAL'}</span>
          </div>
        </div>

        {/* ENERGY */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-terminal flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-cyan-400" /> ENERGY GRID
            </span>
            <span className={`text-base font-bold font-terminal ${energyTextColor}`}>
              {Math.round(ship.energy)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full shadow-sm ${energyColor}`}
              style={{ width: `${Math.max(0, Math.min(100, ship.energy))}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-terminal">
            <span>CAPACITOR BANK</span>
            <span>{ship.energy < 25 ? 'CRITICAL LOW' : 'CHARGED'}</span>
          </div>
        </div>
      </div>

      {/* Speed & Shields Bar */}
      <div className="grid grid-cols-2 gap-3">
        {/* Speed Dial / Indicator */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-terminal flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> SPEED / THROTTLE
            </span>
            <span className="text-sm font-bold font-terminal text-cyan-300">
              {ship.speed} / 5
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-2 flex-1 rounded-sm transition-all duration-200 ${
                  level <= ship.speed
                    ? level >= 4
                      ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                      : 'bg-cyan-400 shadow-sm shadow-cyan-500/50'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-terminal block mt-1.5">
            {ship.speed === 0 ? 'STATIONARY DRIFT' : ship.speed >= 4 ? 'MAX ENGINE BURN' : 'CRUISE VELOCITY'}
          </span>
        </div>

        {/* Deflector Shields */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-terminal flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> DEFLECTOR SHIELD
            </span>
            <span className="text-sm font-bold font-terminal text-indigo-300">
              {Math.round(ship.shields)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2 border border-slate-800">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, ship.shields))}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-terminal block mt-1.5">
            {ship.shields > 0 ? 'FORCEFIELD ONLINE' : 'SHIELDS COLLAPSED'}
          </span>
        </div>
      </div>

      {/* Current Encounter Threat Radar */}
      <div className={`p-3 rounded-lg border transition-all ${
        encounter && encounter.active
          ? encounter.dangerLevel === 'Extreme'
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : encounter.dangerLevel === 'Hazardous'
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
          : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-bold font-display uppercase tracking-wide">
            {encounter && encounter.active ? (
              <>
                <AlertOctagon className="w-4 h-4 animate-bounce" />
                <span>ACTIVE ENCOUNTER: {encounter.title}</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-slate-500" />
                <span>TACTICAL RADAR: CALM DEEP SPACE</span>
              </>
            )}
          </div>
          {encounter && encounter.active && (
            <span className="text-[10px] font-terminal uppercase px-2 py-0.5 rounded bg-black/40 border border-current">
              {encounter.dangerLevel} THREAT
            </span>
          )}
        </div>

        {encounter && encounter.active ? (
          <div className="space-y-1.5 mt-2">
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {encounter.description}
            </p>
            <div className="flex items-center justify-between text-[11px] font-terminal text-slate-400 pt-1 border-t border-white/10">
              <span>CLEARANCE DISTANCE:</span>
              <span className="text-cyan-300 font-bold font-mono">
                {Math.max(0, Math.round(encounter.distanceRemaining))} KM
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-sans mt-1">
            Cruising through interstellar corridor. Awaiting sensor contact with uncharted space anomalies or debris.
          </p>
        )}
      </div>

      {/* The AI Crew (The Agents) Status Cards */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-terminal text-slate-400 uppercase tracking-wider block">
            ACTIVE BRIDGE OFFICERS (EXPRESSIVE AI CREW)
          </span>
          <span
            className="text-[10px] font-terminal text-cyan-400/90 flex items-center gap-1.5"
            title="Portrait halo and borders dynamically intensify with emotional stress levels"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>STRESS GLOW ACTIVE</span>
          </span>
        </div>

        {/* Agent 1: Jax (Chief Engineer) */}
        <div
          onClick={() => handleOpenDossier('Jax')}
          className={`bg-slate-950/80 border rounded-xl p-2.5 flex items-start gap-3 transition-all cursor-pointer group shadow-lg ${
            crew.jaxStress > 70
              ? 'border-rose-500/70 shadow-[0_0_18px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40'
              : crew.jaxStress > 35
              ? 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : activeIdleTopic?.officer === 'Jax'
              ? 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30'
              : 'border-amber-500/30 hover:border-amber-400/60'
          }`}
        >
          {/* Expressive 2D Jax Portrait */}
          <div className="shrink-0">
            <JaxPortrait
              stress={crew.jaxStress}
              status={crew.jaxStatus}
              size={68}
              interactive={false}
              hasIdleTopic={activeIdleTopic?.officer === 'Jax'}
              idleTopicSnippet={activeIdleTopic?.officer === 'Jax' ? activeIdleTopic.title : undefined}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 font-display group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                <span>JAX — CHIEF ENGINEER</span>
                {activeIdleTopic?.officer === 'Jax' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" title="Idle topic available" />
                )}
              </span>
              <span className={`text-[10px] font-terminal px-1.5 py-0.5 rounded ${
                crew.jaxStatus === 'Panicking'
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/60 animate-pulse font-bold'
                  : crew.jaxStatus === 'Stressed'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
              }`}>
                {crew.jaxStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5 font-sans">
              Gruff, protective of reactor coils. Can repair hull, divert energy, tweak speed.
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-terminal">STRESS:</span>
              <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    crew.jaxStress > 70 ? 'bg-rose-500' : crew.jaxStress > 35 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${crew.jaxStress}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-400 font-terminal font-mono">{crew.jaxStress}%</span>
            </div>

            {/* Subtle Idle Conversation Topic UI Badge / Quick Prompt */}
            {activeIdleTopic && activeIdleTopic.officer === 'Jax' && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectIdleTopic) onSelectIdleTopic(activeIdleTopic);
                  else if (onSendCommand) onSendCommand(activeIdleTopic.promptSuggestion);
                }}
                className="mt-2 p-1.5 rounded-lg bg-amber-950/70 border border-amber-500/60 hover:bg-amber-900/60 transition-colors flex items-center justify-between text-[10px] font-terminal cursor-pointer group/topic"
                title={`Ask Jax: "${activeIdleTopic.promptSuggestion}"`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MessageSquare className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-amber-200 font-bold truncate">TOPIC: {activeIdleTopic.title}</span>
                </div>
                <span className="text-amber-300 font-semibold group-hover/topic:underline shrink-0 ml-2">DISCUSS &rarr;</span>
              </div>
            )}

            <div className="mt-1 flex items-center justify-between text-[9px] font-terminal text-slate-500">
              <span>HEART RATE: <strong className="text-rose-400">{Math.round(68 + (crew.jaxStress / 100) * 88)} BPM</strong></span>
              <span className="text-amber-400/80 group-hover:underline">OPEN DOSSIER &rarr;</span>
            </div>
          </div>
        </div>

        {/* Agent 2: Elara (Science Officer) */}
        <div
          onClick={() => handleOpenDossier('Elara')}
          className={`bg-slate-950/80 border rounded-xl p-2.5 flex items-start gap-3 transition-all cursor-pointer group shadow-lg ${
            (crew.elaraStress ?? 12) > 65
              ? 'border-rose-500/70 shadow-[0_0_18px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40'
              : (crew.elaraStress ?? 12) > 35
              ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
              : crew.elaraStatus === 'Fascinated'
              ? 'border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : activeIdleTopic?.officer === 'Elara'
              ? 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/30'
              : 'border-cyan-500/30 hover:border-cyan-400/60'
          }`}
        >
          {/* Expressive 2D Elara Portrait */}
          <div className="shrink-0">
            <ElaraPortrait
              stress={crew.elaraStress ?? 12}
              curiosity={crew.elaraCuriosity}
              status={crew.elaraStatus}
              size={68}
              interactive={false}
              hasIdleTopic={activeIdleTopic?.officer === 'Elara'}
              idleTopicSnippet={activeIdleTopic?.officer === 'Elara' ? activeIdleTopic.title : undefined}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 font-display group-hover:text-cyan-200 transition-colors flex items-center gap-1.5">
                <span>ELARA — SCIENCE OFFICER</span>
                {activeIdleTopic?.officer === 'Elara' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" title="Idle topic available" />
                )}
              </span>
              <span className={`text-[10px] font-terminal px-1.5 py-0.5 rounded ${
                crew.elaraStatus === 'Alarmed'
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/60 animate-pulse font-bold'
                  : crew.elaraStatus === 'Fascinated'
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/60'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
              }`}>
                {crew.elaraStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5 font-sans">
              Cold, logical, analytical. Modulates shields, scans anomalies, siphons cosmic energy.
            </p>
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-terminal w-16">STRESS:</span>
                <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (crew.elaraStress ?? 12) > 60 ? 'bg-rose-500' : 'bg-indigo-400'
                    }`}
                    style={{ width: `${crew.elaraStress ?? 12}%` }}
                  />
                </div>
                <span className="text-[10px] text-indigo-300 font-terminal w-8 text-right font-mono">
                  {crew.elaraStress ?? 12}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-terminal w-16">CURIOSITY:</span>
                <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all"
                    style={{ width: `${crew.elaraCuriosity}%` }}
                  />
                </div>
                <span className="text-[10px] text-cyan-300 font-terminal w-8 text-right font-mono">
                  {crew.elaraCuriosity}%
                </span>
              </div>
            </div>

            {/* Subtle Idle Conversation Topic UI Badge / Quick Prompt */}
            {activeIdleTopic && activeIdleTopic.officer === 'Elara' && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectIdleTopic) onSelectIdleTopic(activeIdleTopic);
                  else if (onSendCommand) onSendCommand(activeIdleTopic.promptSuggestion);
                }}
                className="mt-2 p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/60 hover:bg-cyan-900/60 transition-colors flex items-center justify-between text-[10px] font-terminal cursor-pointer group/topic"
                title={`Ask Elara: "${activeIdleTopic.promptSuggestion}"`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="text-cyan-200 font-bold truncate">TOPIC: {activeIdleTopic.title}</span>
                </div>
                <span className="text-cyan-300 font-semibold group-hover/topic:underline shrink-0 ml-2">DISCUSS &rarr;</span>
              </div>
            )}

            <div className="mt-1 flex items-center justify-between text-[9px] font-terminal text-slate-500">
              <span>HEART RATE: <strong className="text-rose-400">{Math.round(62 + ((crew.elaraStress ?? 12) / 100) * 78)} BPM</strong></span>
              <span className="text-cyan-400/80 group-hover:underline">OPEN DOSSIER &rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

  {/* Internal Officer Dossier Modal if triggered directly */}
      {internalInspect && (
        <OfficerDossierModal
          isOpen={true}
          onClose={() => setInternalInspect(null)}
          officer={internalInspect}
          crew={crew}
          onSendCommand={onSendCommand}
          activeTopic={activeIdleTopic}
          onSelectTopic={onSelectIdleTopic}
        />
      )}
    </div>
  );
};
