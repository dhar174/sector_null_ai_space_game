import React, { useEffect, useState, useRef } from 'react';
import { IdleTopic, CrewStatus } from '../types';
import { MessageSquare, X, ArrowRight, Radio, Sparkles, Wrench } from 'lucide-react';
import { JaxPortrait, ElaraPortrait } from './CrewPortraits';

interface IdleTopicToastProps {
  topic: IdleTopic | null;
  crew: CrewStatus;
  onSelectTopic: (topic: IdleTopic) => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const IdleTopicToast: React.FC<IdleTopicToastProps> = ({
  topic,
  crew,
  onSelectTopic,
  onDismiss,
  durationMs = 14000,
}) => {
  const [progress, setProgress] = useState<number>(100);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(durationMs);

  useEffect(() => {
    if (!topic) return;

    setProgress(100);
    startTimeRef.current = Date.now();
    remainingTimeRef.current = durationMs;

    const interval = setInterval(() => {
      if (isHovered) return;

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const pct = (remaining / durationMs) * 100;
      setProgress(pct);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [topic, isHovered, durationMs, onDismiss]);

  if (!topic) return null;

  const isJax = topic.officer === 'Jax';
  const borderColor = isJax
    ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
    : 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)]';
  const headerColor = isJax ? 'text-amber-300' : 'text-cyan-300';
  const officerTitle = isJax ? 'CHIEF ENGINEER' : 'SCIENCE OFFICER';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        startTimeRef.current = Date.now();
        remainingTimeRef.current = (progress / 100) * durationMs;
      }}
      role="alert"
      aria-live="polite"
      className={`relative w-full max-w-md bg-[#070b16]/95 backdrop-blur-md border ${borderColor} rounded-xl p-3 shadow-2xl transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-3 select-none`}
    >
      {/* Sci-Fi HUD Corner Brackets */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-current opacity-60 pointer-events-none" />
      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-current opacity-60 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-current opacity-60 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-current opacity-60 pointer-events-none" />

      {/* Header Metadata (Clean unboxed text with typographic separator) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-terminal text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className={`font-bold tracking-wider ${headerColor}`}>
            {topic.officer.toUpperCase()}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{officerTitle}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-500 uppercase tracking-wider text-[10px]">IDLE TOPIC</span>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-100 p-0.5 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Dismiss notification (topic remains available in UI)"
          aria-label="Dismiss topic toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Toast Body: Avatar + Topic Details */}
      <div className="flex items-start gap-3">
        {/* Officer Avatar */}
        <div className="shrink-0 pt-0.5">
          {isJax ? (
            <JaxPortrait
              stress={crew.jaxStress}
              status={crew.jaxStatus}
              size={46}
              interactive={false}
            />
          ) : (
            <ElaraPortrait
              stress={crew.elaraStress ?? 12}
              curiosity={crew.elaraCuriosity}
              status={crew.elaraStatus}
              size={46}
              interactive={false}
            />
          )}
        </div>

        {/* Content & Snippet */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-100 truncate">
            {topic.title}
          </h4>
          <p className="text-xs text-slate-300 font-sans italic mt-0.5 leading-snug line-clamp-2">
            &ldquo;{topic.snippet}&rdquo;
          </p>

          {/* Action Row */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-terminal text-slate-400 truncate hidden sm:inline">
              Ask: &quot;{topic.promptSuggestion}&quot;
            </span>

            <button
              onClick={() => onSelectTopic(topic)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-terminal font-semibold transition-all cursor-pointer shadow-sm ${
                isJax
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-200 hover:text-amber-100 hover:border-amber-400'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/60 text-cyan-200 hover:text-cyan-100 hover:border-cyan-400'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>DISCUSS</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Auto-Dismiss Progress Bar at base */}
      <div className="w-full bg-slate-800/40 h-0.5 rounded-full overflow-hidden mt-2.5">
        <div
          className={`h-full transition-all duration-100 ease-linear ${
            isJax ? 'bg-amber-400/80' : 'bg-cyan-400/80'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
