import React, { useEffect, useRef } from 'react';
import { CommsMessage, CrewStatus, IdleTopic } from '../types';
import {
  MessageSquare,
  Wrench,
  Sparkles,
  Terminal,
  UserCheck,
  Volume2,
  VolumeX,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  Radio,
} from 'lucide-react';
import { JaxPortrait, ElaraPortrait, CharacterType } from './CrewPortraits';

interface CommsFeedProps {
  messages: CommsMessage[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearMessages: () => void;
  hull?: number;
  crew?: CrewStatus;
  onInspectOfficer?: (officer: CharacterType) => void;
  activeIdleTopic?: IdleTopic | null;
  onSelectIdleTopic?: (topic: IdleTopic) => void;
}

export const CommsFeed: React.FC<CommsFeedProps> = ({
  messages,
  soundEnabled,
  onToggleSound,
  onClearMessages,
  hull,
  crew,
  onInspectOfficer,
  activeIdleTopic,
  onSelectIdleTopic,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHullCritical = typeof hull === 'number' && hull < 20 && hull > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getSpeakerStyle = (speaker: string, isCritical?: boolean) => {
    if (isCritical) {
      return {
        badge: 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-sm shadow-rose-900/60',
        bubble: 'bg-gradient-to-r from-rose-950/70 via-rose-900/40 to-rose-950/70 border-rose-500/80 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40',
        name: 'text-rose-300',
        icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />,
        role: 'EMERGENCY COMM',
      };
    }

    switch (speaker) {
      case 'Jax':
        return {
          badge: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
          bubble: 'bg-amber-950/20 border-amber-900/40 text-slate-200',
          name: 'text-amber-400',
          icon: <Wrench className="w-3.5 h-3.5 text-amber-400" />,
          role: 'CHIEF ENGINEER',
        };
      case 'Elara':
        return {
          badge: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300',
          bubble: 'bg-cyan-950/20 border-cyan-900/40 text-slate-200',
          name: 'text-cyan-400',
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
          role: 'SCIENCE OFFICER',
        };
      case 'Captain':
        return {
          badge: 'bg-sky-950/90 border-sky-400/80 text-sky-200',
          bubble: 'bg-sky-950/30 border-sky-900/50 text-sky-100',
          name: 'text-sky-300',
          icon: <UserCheck className="w-3.5 h-3.5 text-sky-300" />,
          role: 'CAPTAIN ON DECK',
        };
      default:
        return {
          badge: 'bg-slate-900/80 border-slate-700 text-slate-300',
          bubble: 'bg-slate-950/40 border-slate-800 text-slate-300',
          name: 'text-slate-400',
          icon: <Terminal className="w-3.5 h-3.5 text-slate-400" />,
          role: 'SHIP COMPUTER',
        };
    }
  };

  return (
    <div
      id="comms-feed-panel"
      className={`flex flex-col h-full bg-[#080b14] border rounded-xl p-3.5 shadow-xl font-sans transition-all duration-500 ${
        isHullCritical
          ? 'border-rose-600/70 shadow-[0_0_25px_rgba(225,29,72,0.2)] ring-1 ring-rose-600/30'
          : 'border-cyan-900/40'
      }`}
    >
      {/* Comms Bar Header */}
      <div
        className={`flex items-center justify-between border-b pb-2.5 mb-2.5 transition-colors ${
          isHullCritical ? 'border-rose-800/60' : 'border-cyan-900/40'
        }`}
      >
        <div className="flex items-center gap-2">
          {isHullCritical ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          )}
          <h3
            className={`text-xs font-bold font-display uppercase tracking-wider ${
              isHullCritical ? 'text-rose-200' : 'text-slate-100'
            }`}
          >
            Tactical Bridge Comms Feed
          </h3>
          <span
            className={`text-[10px] font-terminal px-2 py-0.5 rounded border transition-colors ${
              isHullCritical
                ? 'text-rose-300 bg-rose-950/80 border-rose-500/60 animate-pulse font-bold'
                : 'text-cyan-400/70 bg-cyan-950/60 border-cyan-800/40'
            }`}
          >
            {isHullCritical ? 'PRIORITY 1 // RED ALERT' : 'FREQ: 1420.40 MHz // SECURE'}
          </span>

          {/* Idle topic quick badge */}
          {activeIdleTopic && (
            <button
              onClick={() => onSelectIdleTopic?.(activeIdleTopic)}
              className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-terminal border transition-all cursor-pointer ${
                activeIdleTopic.officer === 'Jax'
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/70'
                  : 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300 hover:bg-cyan-900/70'
              }`}
              title={`Discuss with ${activeIdleTopic.officer}: "${activeIdleTopic.promptSuggestion}"`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold uppercase">{activeIdleTopic.officer}:</span>
              <span className="truncate max-w-[130px]">{activeIdleTopic.title}</span>
              <span className="underline ml-0.5">DISCUSS &rarr;</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Bridge Audio' : 'Unmute Bridge Audio'}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClearMessages}
            title="Clear Feed Log"
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Emergency Sticky Banner when hull is critical (<20%) */}
      {isHullCritical && (
        <div className="mb-2.5 px-3 py-2 rounded-lg bg-gradient-to-r from-rose-950/95 via-rose-900/60 to-rose-950/95 border border-rose-500 text-rose-100 flex items-center justify-between shadow-[0_0_15px_rgba(244,63,94,0.35)] animate-pulse shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="min-w-0">
              <div className="text-[10px] font-terminal font-bold text-rose-300 tracking-wider flex items-center gap-1.5 truncate">
                <span>🚨 CATASTROPHIC HULL WARNING: {Math.round(hull)}%</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-800 text-rose-100 font-normal">DECOMPRESSION RISK</span>
              </div>
              <div className="text-[10px] text-rose-200/90 font-sans truncate">
                Bulkheads compromised! Order Jax to initiate emergency nanite repairs!
              </div>
            </div>
          </div>
          <span className="text-[9px] font-terminal px-2 py-0.5 rounded bg-rose-900/90 border border-rose-400 text-white font-bold shrink-0 ml-2">
            HULL &lt; 20%
          </span>
        </div>
      )}

      {/* Scrolling Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-terminal text-slate-500 italic">
            Bridge comms channel open. Issue captain orders below.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCritical =
              msg.sentiment === 'critical' ||
              msg.isUrgent ||
              msg.priority === 'critical' ||
              (msg.text.includes('RED ALERT') && msg.text.includes('HULL'));

            const style = getSpeakerStyle(msg.speaker, isCritical);
            const isCaptain = msg.speaker === 'Captain';
            const isJax = msg.speaker === 'Jax';
            const isElara = msg.speaker === 'Elara';
            const isLatest = index === messages.length - 1;

            const entranceClass = isCritical
              ? 'animate-comms-entry-critical'
              : isCaptain
              ? 'animate-comms-entry-captain'
              : 'animate-comms-entry';

            return (
              <div
                key={msg.id}
                className={`relative p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 overflow-hidden ${entranceClass} ${style.bubble} ${
                  isCaptain ? 'ml-4 bg-sky-950/20 border-sky-800/40 shadow-sm shadow-sky-950/40' : 'mr-2'
                }`}
              >
                {/* Subtle speaker frequency edge accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                    isCritical
                      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                      : isJax
                      ? 'bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                      : isElara
                      ? 'bg-cyan-400/80 shadow-[0_0_6px_rgba(6,182,212,0.5)]'
                      : isCaptain
                      ? 'bg-sky-400/80 shadow-[0_0_6px_rgba(56,189,248,0.5)]'
                      : 'bg-slate-600/60'
                  }`}
                />

                {/* Subtle initial reception scanline sweep */}
                <div className="absolute inset-0 pointer-events-none opacity-25 bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-y-full animate-[commsIncomingScanline_0.6s_ease-out_forwards]" />

                {/* Officer Expressive 2D Portrait Avatar if Jax or Elara */}
                {isJax && crew && (
                  <div className="shrink-0 pt-0.5 relative z-10">
                    <JaxPortrait
                      stress={crew.jaxStress}
                      status={crew.jaxStatus}
                      size={36}
                      onClick={() => onInspectOfficer && onInspectOfficer('Jax')}
                    />
                  </div>
                )}
                {isElara && crew && (
                  <div className="shrink-0 pt-0.5 relative z-10">
                    <ElaraPortrait
                      stress={crew.elaraStress ?? 12}
                      curiosity={crew.elaraCuriosity}
                      status={crew.elaraStatus}
                      size={36}
                      onClick={() => onInspectOfficer && onInspectOfficer('Elara')}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-terminal font-semibold flex items-center gap-1 ${style.badge}`}
                      >
                        {style.icon}
                        {msg.speaker.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-terminal hidden sm:inline">
                        [{style.role}]
                      </span>
                      {isJax && crew && (
                        <span className="text-[9px] font-terminal text-amber-400/90 hidden sm:inline">
                          ({crew.jaxStatus} // {crew.jaxStress}% STR)
                        </span>
                      )}
                      {isElara && crew && (
                        <span className="text-[9px] font-terminal text-cyan-400/90 hidden sm:inline">
                          ({crew.elaraStatus} // {crew.elaraStress ?? 12}% STR)
                        </span>
                      )}
                      {isCritical && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-900/90 border border-rose-400/80 text-rose-100 text-[9px] font-terminal font-bold animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-300" />
                          CRITICAL
                        </span>
                      )}
                      {isLatest && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-terminal text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.2 rounded shadow-[0_0_6px_rgba(16,185,129,0.3)] animate-pulse">
                          <Radio className="w-2.5 h-2.5 text-emerald-400" />
                          <span>NEW</span>
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-terminal ${isCritical ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                  <p
                    className={`leading-relaxed font-sans text-xs pl-0.5 ${
                      isCritical ? 'text-rose-100 font-medium tracking-wide' : 'text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
