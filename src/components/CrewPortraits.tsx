import React, { useState } from 'react';
import { CrewStatus, IdleTopic } from '../types';
import {
  Heart,
  Activity,
  Zap,
  Sparkles,
  AlertTriangle,
  Radio,
  Sliders,
  X,
  ExternalLink,
  Cpu,
  Brain,
  ShieldAlert,
  Flame,
  MessageSquare,
} from 'lucide-react';

export type CharacterType = 'Jax' | 'Elara';

interface PortraitProps {
  size?: number; // Size in px, default 80
  className?: string;
  showStatusBadge?: boolean;
  onClick?: () => void;
  interactive?: boolean;
  hasIdleTopic?: boolean;
  idleTopicSnippet?: string;
}

interface JaxPortraitProps extends PortraitProps {
  stress: number;
  status: CrewStatus['jaxStatus'];
  overrideEmotion?: 'Nominal' | 'Stressed' | 'Panicking' | null;
}

interface ElaraPortraitProps extends PortraitProps {
  stress: number;
  curiosity: number;
  status: CrewStatus['elaraStatus'];
  overrideEmotion?: 'Analytical' | 'Intrigued' | 'Fascinated' | 'Alarmed' | null;
}

/**
 * Expressive 2D Headshot Portrait for Jax (Chief Engineer).
 * Dynamically reacts to stress level and emotional status.
 */
export const JaxPortrait: React.FC<JaxPortraitProps> = ({
  stress,
  status,
  size = 80,
  className = '',
  showStatusBadge = false,
  onClick,
  interactive = true,
  overrideEmotion,
  hasIdleTopic = false,
  idleTopicSnippet,
}) => {
  // Determine effective emotional expression
  const effectiveEmotion: 'Nominal' | 'Stressed' | 'Panicking' =
    overrideEmotion ||
    (status === 'Panicking' || stress > 70
      ? 'Panicking'
      : status === 'Stressed' || stress > 35
      ? 'Stressed'
      : 'Nominal');

  const isPanic = effectiveEmotion === 'Panicking';
  const isStressed = effectiveEmotion === 'Stressed';

  // Biometric Heart Rate based on stress
  const heartRate = Math.min(185, Math.round(68 + (stress / 100) * 88));

  return (
    <div
      onClick={interactive && onClick ? onClick : undefined}
      className={`relative inline-block select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title={`Jax (Chief Engineer) - Emotion: ${effectiveEmotion}, Stress: ${stress}%, Heart Rate: ${heartRate} BPM (Click to inspect dossier)`}
    >
      {/* Outer Sci-Fi HUD Frame */}
      <div
        className={`w-full h-full rounded-xl overflow-hidden border-2 relative transition-all duration-300 ${
          isPanic
            ? 'border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.6)] ring-2 ring-rose-500/50 animate-pulse'
            : isStressed
            ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            : 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
        } bg-[#0c101a]`}
      >
        {/* Animated Emergency Strobes / Ambient Lighting */}
        {isPanic && (
          <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 via-rose-600/20 to-transparent pointer-events-none z-10 animate-pulse" />
        )}
        {isStressed && (
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/40 via-transparent to-transparent pointer-events-none z-10" />
        )}

        {/* 2D Expressive Vector Portrait SVG */}
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full transition-transform duration-300 ${
            isPanic ? 'animate-[bounce_0.6s_infinite]' : 'group-hover:scale-105'
          }`}
        >
          <defs>
            {/* Background Engineering Gradients */}
            <radialGradient id="jax-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isPanic ? '#450a0a' : isStressed ? '#451a03' : '#1c1917'} />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>

            {/* Skin Shading */}
            <linearGradient id="jax-skin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPanic ? '#e29b82' : '#d49b78'} />
              <stop offset="100%" stopColor={isPanic ? '#993527' : '#926042'} />
            </linearGradient>

            {/* Ocular Amber Glow Filter */}
            <filter id="amber-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Panic Red Glow Filter */}
            <filter id="panic-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Backing with conduit grid */}
          <rect width="100" height="100" fill="url(#jax-bg)" />
          <path
            d="M10 20 L90 20 M10 80 L90 80 M50 10 L50 90"
            stroke={isPanic ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />

          {/* Torso / Heavy Engineering Collar */}
          <path
            d="M12 100 L25 82 L75 82 L88 100 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Engineering vest amber piping */}
          <path
            d="M32 82 L42 100 M68 82 L58 100"
            stroke={isPanic ? '#ef4444' : '#f59e0b'}
            strokeWidth="2.5"
          />
          {/* Collar neck opening */}
          <path d="M40 82 L50 92 L60 82 Z" fill="#0f172a" />

          {/* Neck */}
          <rect x="42" y="70" width="16" height="15" rx="3" fill="#926042" />
          {/* Neck tendon shadows */}
          <path
            d="M45 72 L46 80 M55 72 L54 80"
            stroke="#633920"
            strokeWidth={isPanic ? '1.8' : '1'}
          />

          {/* Ears */}
          <ellipse cx="27" cy="53" rx="4" ry="7" fill="#b07655" />
          <ellipse cx="73" cy="53" rx="4" ry="7" fill="#b07655" />

          {/* Comms Headset Over Left Ear (Viewer Right) */}
          <circle cx="74" cy="52" r="5" fill="#334155" stroke="#f59e0b" strokeWidth="1" />
          <path
            d="M74 54 Q65 62 58 64"
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="58"
            cy="64"
            r="2"
            fill={isPanic ? '#ef4444' : '#10b981'}
            className={isPanic ? 'animate-ping' : ''}
          />

          {/* Head & Jaw (Strong grizzled square shape) */}
          <path
            d="M30 45 C30 30 70 30 70 45 C70 56 66 72 50 74 C34 72 30 56 30 45 Z"
            fill="url(#jax-skin)"
          />

          {/* Cheek grease smudge */}
          <ellipse cx="38" cy="58" rx="4" ry="2" fill="#33241b" opacity="0.45" />

          {/* Grizzled Beard & Goatee */}
          <path
            d="M32 50 C33 66 40 73 50 74 C60 73 67 66 68 50 C65 54 62 56 59 55 C55 62 45 62 41 55 C38 56 35 54 32 50 Z"
            fill="#27221f"
          />
          {/* Mustache */}
          <path
            d="M40 59 C44 57 48 57 50 59 C52 57 56 57 60 59 C58 63 42 63 40 59 Z"
            fill="#1c1816"
          />

          {/* Short Spiky Dark Hair */}
          <path
            d="M28 42 C27 28 35 20 50 20 C65 20 73 28 72 42 C70 32 66 26 50 26 C34 26 30 32 28 42 Z"
            fill="#1f1a18"
          />
          <path
            d="M34 25 L38 18 L44 24 L50 17 L56 24 L62 18 L66 25 Z"
            fill="#1f1a18"
          />
          {/* Gray temple highlights */}
          <path d="M29 36 L32 30 M71 36 L68 30" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />

          {/* ===== DYNAMIC EXPRESSIONS (BROWS, EYES, MOUTH) ===== */}

          {/* 1. EYEBROWS */}
          {isPanic ? (
            /* Panicking: High arched brows of distress */
            <g>
              <path d="M34 40 Q40 33 46 39" fill="none" stroke="#1f1a18" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M54 39 Q60 33 66 40" fill="none" stroke="#1f1a18" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : isStressed ? (
            /* Stressed: Heavily furrowed down towards center */
            <g>
              <path d="M34 38 L46 43" fill="none" stroke="#1f1a18" strokeWidth="3" strokeLinecap="round" />
              <path d="M54 43 L66 38" fill="none" stroke="#1f1a18" strokeWidth="3" strokeLinecap="round" />
              {/* Vertical stress crease on forehead */}
              <line x1="49" y1="36" x2="49" y2="42" stroke="#633920" strokeWidth="1.2" />
              <line x1="51" y1="37" x2="51" y2="41" stroke="#633920" strokeWidth="1" />
            </g>
          ) : (
            /* Nominal: Confident, slight wry smirk angle */
            <g>
              <path d="M34 40 Q40 39 46 41" fill="none" stroke="#1f1a18" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M54 41 Q60 38 66 37" fill="none" stroke="#1f1a18" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* 2. JAX'S RIGHT EYE (Viewer Left) - CYBERNETIC OCULAR EYEPIECE */}
          <g filter={isPanic ? 'url(#panic-glow)' : 'url(#amber-glow)'}>
            {/* Metallic casing */}
            <circle cx="40" cy="47" r="7.5" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
            {/* Glowing lens */}
            <circle
              cx="40"
              cy="47"
              r="5.5"
              fill={isPanic ? '#dc2626' : isStressed ? '#ea580c' : '#f59e0b'}
              className={isPanic ? 'animate-ping' : ''}
            />
            {/* Ocular reticle crosshair */}
            <path
              d="M40 43 L40 51 M36 47 L44 47"
              stroke="#ffffff"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <circle cx="40" cy="47" r="3" fill="none" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="1 1" />
          </g>

          {/* 3. JAX'S NATURAL EYE (Viewer Right) */}
          {isPanic ? (
            /* Panicking: Wide, dilated, terrified pupil */
            <g>
              <ellipse cx="60" cy="47" rx="5.5" ry="5.5" fill="#ffffff" />
              <circle cx="60" cy="47" r="2.8" fill="#450a0a" stroke="#dc2626" strokeWidth="0.8" />
              <circle cx="60" cy="47" r="1.5" fill="#000000" />
              <circle cx="59" cy="46" r="0.6" fill="#ffffff" />
            </g>
          ) : isStressed ? (
            /* Stressed: Narrowed, strained focus with under-eye bag */
            <g>
              <path d="M54 47 Q60 44 66 47 Q60 50 54 47 Z" fill="#ffffff" />
              <circle cx="60" cy="47" r="2.2" fill="#78350f" />
              <circle cx="60" cy="47" r="1" fill="#000000" />
              {/* Under-eye strain shadow */}
              <path d="M55 50 Q60 52 65 50" fill="none" stroke="#633920" strokeWidth="1" />
            </g>
          ) : (
            /* Nominal: Calm, confident, almond shaped */
            <g>
              <path d="M54 47 Q60 43 66 47 Q60 50 54 47 Z" fill="#ffffff" />
              <circle cx="60" cy="46.8" r="2.2" fill="#78350f" />
              <circle cx="60" cy="46.8" r="1.1" fill="#000000" />
              <circle cx="59.2" cy="46" r="0.7" fill="#ffffff" />
            </g>
          )}

          {/* 4. MOUTH */}
          {isPanic ? (
            /* Shouting into comms in sheer panic */
            <g>
              <path
                d="M44 64 C44 61 56 61 56 64 C56 71 44 71 44 64 Z"
                fill="#450a0a"
                stroke="#1f1a18"
                strokeWidth="1.2"
              />
              {/* Upper & lower teeth */}
              <path d="M46 63 L54 63" stroke="#f8fafc" strokeWidth="1.5" />
              <path d="M47 67 L53 67" stroke="#f8fafc" strokeWidth="1" />
              {/* Red glow in mouth */}
              <circle cx="50" cy="65" r="2" fill="#ef4444" opacity="0.6" />
            </g>
          ) : isStressed ? (
            /* Stressed: Clenched teeth grimace */
            <g>
              <path
                d="M43 64 L57 64"
                stroke="#1f1a18"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M44 64 L56 64"
                stroke="#f8fafc"
                strokeWidth="1.8"
                strokeDasharray="2 1"
              />
            </g>
          ) : (
            /* Nominal: Confident wry smirk */
            <path
              d="M44 64 Q50 63 56 62 Q52 66 44 64 Z"
              fill="#27221f"
              stroke="#1f1a18"
              strokeWidth="0.8"
            />
          )}

          {/* 5. DYNAMIC SWEAT PARTICLES (When Stressed or Panicking) */}
          {(isPanic || isStressed) && (
            <g fill="#38bdf8" opacity="0.85">
              {/* Forehead sweat drop */}
              <path d="M57 32 C57 30 59 30 59 32 C59 34 57 34 57 32 Z" />
              {/* Temple dripping bead */}
              <circle cx="68" cy="42" r="1.2" />
              {isPanic && (
                <>
                  <circle cx="33" cy="38" r="1.4" />
                  <circle cx="65" cy="55" r="1.2" />
                </>
              )}
            </g>
          )}

          {/* HUD Tech Frame Overlay & Corner Markers */}
          <path
            d="M3 10 L3 3 L10 3 M97 10 L97 3 L90 3 M3 90 L3 97 L10 97 M97 90 L97 97 L90 97"
            fill="none"
            stroke={isPanic ? '#f43f5e' : isStressed ? '#f59e0b' : '#38bdf8'}
            strokeWidth="1.8"
          />

          {/* Status Label Inside HUD */}
          <text
            x="50"
            y="12"
            textAnchor="middle"
            fill={isPanic ? '#fda4af' : isStressed ? '#fcd34d' : '#94a3b8'}
            fontSize="5.5"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="0.8"
          >
            {isPanic ? '⚠️ CRITICAL OVERHEAT' : isStressed ? 'STRAINED' : 'JAX // ENGR'}
          </text>
        </svg>

        {/* Scanline CRT overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-40" />

        {/* Live Heart Rate Telemetry Pip (Bottom Left) */}
        <div className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/75 border border-white/10 text-[8px] font-terminal text-slate-300">
          <Heart
            className={`w-2.5 h-2.5 ${
              isPanic
                ? 'text-rose-400 animate-ping'
                : isStressed
                ? 'text-amber-400 animate-pulse'
                : 'text-rose-500'
            }`}
          />
          <span className="font-mono text-[8px]">{heartRate}</span>
        </div>

        {/* Stress Bar Pill (Bottom Right) */}
        <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/75 border border-white/10 text-[8px] font-terminal">
          <span
            className={`font-bold ${
              isPanic
                ? 'text-rose-400'
                : isStressed
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {stress}%
          </span>
        </div>

        {/* Subtle Idle Conversation Topic UI Badge */}
        {hasIdleTopic && (
          <div
            className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-950 shadow-md shadow-amber-500/60 ring-2 ring-slate-950 animate-bounce"
            title={idleTopicSnippet ? `New Topic: ${idleTopicSnippet}` : 'New idle conversation topic available!'}
          >
            <MessageSquare className="w-2.5 h-2.5 fill-current" />
          </div>
        )}
      </div>

      {/* Optional Sub-badge */}
      {showStatusBadge && (
        <div className="mt-1 text-center">
          <span
            className={`inline-block text-[9px] font-terminal px-1.5 py-0.5 rounded border uppercase tracking-wider ${
              isPanic
                ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse'
                : isStressed
                ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
            }`}
          >
            {effectiveEmotion}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Expressive 2D Headshot Portrait for Elara (Science Officer).
 * Dynamically reacts to stress level, curiosity, and emotional status.
 */
export const ElaraPortrait: React.FC<ElaraPortraitProps> = ({
  stress,
  curiosity,
  status,
  size = 80,
  className = '',
  showStatusBadge = false,
  onClick,
  interactive = true,
  overrideEmotion,
  hasIdleTopic = false,
  idleTopicSnippet,
}) => {
  // Determine effective emotional expression
  const effectiveEmotion: 'Analytical' | 'Intrigued' | 'Fascinated' | 'Alarmed' =
    overrideEmotion ||
    (status === 'Alarmed' || stress > 65
      ? 'Alarmed'
      : curiosity > 75
      ? 'Fascinated'
      : curiosity > 45
      ? 'Intrigued'
      : 'Analytical');

  const isAlarmed = effectiveEmotion === 'Alarmed';
  const isFascinated = effectiveEmotion === 'Fascinated';
  const isIntrigued = effectiveEmotion === 'Intrigued';

  // Biometric Heart Rate based on stress
  const heartRate = Math.min(175, Math.round(62 + (stress / 100) * 78));

  return (
    <div
      onClick={interactive && onClick ? onClick : undefined}
      className={`relative inline-block select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title={`Elara (Science Officer) - Emotion: ${effectiveEmotion}, Stress: ${stress}%, Curiosity: ${curiosity}%, Heart Rate: ${heartRate} BPM (Click to inspect dossier)`}
    >
      {/* Outer Sci-Fi HUD Frame */}
      <div
        className={`w-full h-full rounded-xl overflow-hidden border-2 relative transition-all duration-300 ${
          isAlarmed
            ? 'border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.6)] ring-2 ring-rose-500/50 animate-pulse'
            : isFascinated
            ? 'border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.6)] ring-1 ring-cyan-400/40'
            : isIntrigued
            ? 'border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
            : 'border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
        } bg-[#080d1a]`}
      >
        {/* Animated Emergency Strobe / Cosmic Aurora Lighting */}
        {isAlarmed && (
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950/60 via-rose-600/20 to-transparent pointer-events-none z-10 animate-pulse" />
        )}
        {isFascinated && (
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/40 via-purple-900/20 to-transparent pointer-events-none z-10" />
        )}

        {/* 2D Expressive Vector Portrait SVG */}
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full transition-transform duration-300 ${
            isAlarmed
              ? 'animate-[bounce_0.6s_infinite]'
              : isFascinated
              ? 'group-hover:scale-105'
              : 'group-hover:scale-105'
          }`}
        >
          <defs>
            {/* Background Astrometrics Gradients */}
            <radialGradient id="elara-bg" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={
                  isAlarmed
                    ? '#450a0a'
                    : isFascinated
                    ? '#1e1b4b'
                    : isIntrigued
                    ? '#082f49'
                    : '#030712'
                }
              />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Porcelain Skin Shading */}
            <linearGradient id="elara-skin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isAlarmed ? '#fee2e2' : '#f1f5f9'} />
              <stop offset="100%" stopColor={isAlarmed ? '#fca5a5' : '#cbd5e1'} />
            </linearGradient>

            {/* Cyan Visor Glow */}
            <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Celestial Wonder Glow */}
            <filter id="wonder-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Deep Space Background */}
          <rect width="100" height="100" fill="url(#elara-bg)" />

          {/* Background Celestial Stars & Coordinates */}
          <g opacity={isFascinated ? '0.7' : '0.3'}>
            <circle cx="18" cy="22" r="0.8" fill="#38bdf8" />
            <circle cx="82" cy="18" r="1.2" fill="#a855f7" />
            <circle cx="88" cy="74" r="0.8" fill="#38bdf8" />
            <circle cx="14" cy="78" r="0.7" fill="#ffffff" />
            <path
              d="M15 15 L25 15 M80 25 L85 25"
              stroke="#06b6d4"
              strokeWidth="0.5"
            />
          </g>

          {/* Science Division High-Collar Uniform */}
          <path
            d="M14 100 L28 82 L72 82 L86 100 Z"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="1.2"
          />
          {/* Cyan quantum lattice trim */}
          <path
            d="M36 82 L44 100 M64 82 L56 100"
            stroke={isAlarmed ? '#ef4444' : isFascinated ? '#06b6d4' : '#38bdf8'}
            strokeWidth="2"
          />
          {/* Sleek neck collar */}
          <path d="M42 82 L50 88 L58 82 Z" fill="#0284c7" />

          {/* Graceful Neck */}
          <rect x="44" y="70" width="12" height="14" rx="2" fill="#cbd5e1" />
          <path d="M47 72 L47 80 M53 72 L53 80" stroke="#94a3b8" strokeWidth="0.8" />

          {/* Ears */}
          <ellipse cx="30" cy="52" rx="3.5" ry="6" fill="#e2e8f0" />
          <ellipse cx="70" cy="52" rx="3.5" ry="6" fill="#e2e8f0" />

          {/* Cybernetic Temple Node (Viewer Left / Her Right) */}
          <circle cx="31" cy="48" r="2.2" fill="#0f172a" stroke="#06b6d4" strokeWidth="0.8" />
          <circle cx="31" cy="48" r="1" fill="#38bdf8" className="animate-pulse" />

          {/* Head & Jaw (Sharp, elegant, intelligent chin) */}
          <path
            d="M32 44 C32 30 68 30 68 44 C68 56 64 72 50 74 C36 72 32 56 32 44 Z"
            fill="url(#elara-skin)"
          />

          {/* Sleek Asymmetrical Indigo/Teal Bob Hairstyle */}
          {/* Back hair */}
          <path
            d="M26 40 C24 60 28 74 34 76 C28 66 26 50 28 35 Z"
            fill="#0e1726"
          />
          {/* Main sleek hair silhouette */}
          <path
            d="M28 42 C27 26 36 18 50 18 C64 18 73 26 72 42 C72 54 70 66 64 68 C66 52 64 36 50 34 C36 36 30 46 28 42 Z"
            fill="#0f172a"
          />
          {/* Asymmetrical fringe / sharp bangs with cyan highlight */}
          <path
            d="M30 36 C38 28 58 26 68 38 C60 34 46 32 36 40 Z"
            fill="#164e63"
          />
          {/* Electric cyan hair streak */}
          <path
            d="M34 32 C40 28 52 28 60 33"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Elongated left front hair strand */}
          <path
            d="M66 38 C68 48 68 58 64 66 C65 54 65 44 63 38 Z"
            fill="#0f172a"
          />

          {/* ===== DYNAMIC EXPRESSIONS (BROWS, EYES, VISOR, MOUTH) ===== */}

          {/* 1. EYEBROWS */}
          {isAlarmed ? (
            /* Alarmed: Angled inward and upward in acute apprehension */
            <g>
              <path d="M37 38 L46 42" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M54 42 L63 38" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ) : isFascinated || isIntrigued ? (
            /* Fascinated / Intrigued: Elegantly arched high in wonder */
            <g>
              <path d="M36 38 Q42 34 47 38" fill="none" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M53 37 Q58 33 64 38" fill="none" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          ) : (
            /* Analytical: Perfectly horizontal, poised, logical */
            <g>
              <path d="M36 39 L47 39" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M53 39 L64 39" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {/* 2. ELARA'S HOLOGRAPHIC VISOR / EYE (Viewer Left / Her Right) */}
          <g filter={isFascinated ? 'url(#wonder-glow)' : 'url(#cyan-glow)'}>
            {/* Holographic frame over eye */}
            <path
              d="M34 43 L48 43 L46 51 L36 51 Z"
              fill={
                isAlarmed
                  ? 'rgba(239,68,68,0.35)'
                  : isFascinated
                  ? 'rgba(6,182,212,0.45)'
                  : 'rgba(56,189,248,0.25)'
              }
              stroke={isAlarmed ? '#ef4444' : isFascinated ? '#38bdf8' : '#06b6d4'}
              strokeWidth="0.8"
            />
            {/* Scanning data lines or constellation */}
            {isAlarmed ? (
              <g stroke="#ffffff" strokeWidth="0.6">
                <line x1="36" y1="45" x2="46" y2="49" />
                <line x1="36" y1="49" x2="46" y2="45" />
                <circle cx="41" cy="47" r="1.5" fill="#f43f5e" />
              </g>
            ) : isFascinated ? (
              /* Glowing cosmic ring in visor */
              <g>
                <circle cx="41" cy="47" r="2.8" fill="none" stroke="#a855f7" strokeWidth="0.8" />
                <circle cx="41" cy="47" r="1.2" fill="#38bdf8" />
                <circle cx="44" cy="45" r="0.6" fill="#ffffff" />
              </g>
            ) : (
              /* Calm horizontal telemetry scan */
              <g stroke="#38bdf8" strokeWidth="0.6">
                <line x1="36" y1="47" x2="46" y2="47" />
                <circle cx="41" cy="47" r="1.8" fill="#0284c7" />
                <circle cx="41" cy="47" r="0.8" fill="#ffffff" />
              </g>
            )}
          </g>

          {/* 3. ELARA'S NATURAL EYE (Viewer Right / Her Left) */}
          {isAlarmed ? (
            /* Alarmed: Wide, terrified, dilated sapphire pupil */
            <g>
              <ellipse cx="58" cy="47" rx="5.5" ry="5.5" fill="#ffffff" />
              <circle cx="58" cy="47" r="2.8" fill="#1e3a8a" stroke="#ef4444" strokeWidth="0.8" />
              <circle cx="58" cy="47" r="1.4" fill="#020617" />
              <circle cx="57" cy="46" r="0.6" fill="#ffffff" />
            </g>
          ) : isFascinated ? (
            /* Fascinated: Sparkling with cosmic stars & wonder */
            <g>
              <path d="M53 46 Q58 41 64 46 Q58 52 53 46 Z" fill="#ffffff" />
              <circle cx="58.5" cy="46.5" r="3" fill="#0284c7" />
              <circle cx="58.5" cy="46.5" r="1.5" fill="#0f172a" />
              {/* Star sparkles in pupil */}
              <circle cx="57.5" cy="45" r="0.8" fill="#ffffff" />
              <circle cx="59.5" cy="48" r="0.5" fill="#c084fc" />
            </g>
          ) : isIntrigued ? (
            /* Intrigued: Keen, sharp intelligent gaze */
            <g>
              <path d="M53 47 Q58 42 64 46 Q58 51 53 47 Z" fill="#ffffff" />
              <circle cx="58.5" cy="46.5" r="2.5" fill="#0369a1" />
              <circle cx="58.5" cy="46.5" r="1.2" fill="#0f172a" />
              <circle cx="57.5" cy="45.5" r="0.7" fill="#ffffff" />
            </g>
          ) : (
            /* Analytical: Cool, calm, stoic almond shape */
            <g>
              <path d="M53 47 Q58 43 64 47 Q58 50 53 47 Z" fill="#ffffff" />
              <circle cx="58.5" cy="46.8" r="2.2" fill="#0284c7" />
              <circle cx="58.5" cy="46.8" r="1" fill="#0f172a" />
              <circle cx="57.8" cy="46" r="0.6" fill="#ffffff" />
            </g>
          )}

          {/* 4. MOUTH */}
          {isAlarmed ? (
            /* Parted in sharp intake of breath */
            <g>
              <ellipse cx="50" cy="64" rx="4" ry="2.5" fill="#881337" stroke="#4c0519" strokeWidth="0.8" />
              <line x1="48" y1="63" x2="52" y2="63" stroke="#ffffff" strokeWidth="0.8" />
            </g>
          ) : isFascinated ? (
            /* Soft, fascinated smile */
            <path
              d="M45 63 Q50 67 55 63"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          ) : isIntrigued ? (
            /* Slight curious upward curve */
            <path
              d="M46 64 Q50 66 54 64"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ) : (
            /* Analytical: Poised, calm straight line */
            <line
              x1="46"
              y1="64"
              x2="54"
              y2="64"
              stroke="#0f172a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}

          {/* Cosmic Nebula Particles (When Fascinated) */}
          {isFascinated && (
            <g fill="#a855f7" opacity="0.8">
              <circle cx="22" cy="35" r="1.2" className="animate-ping" />
              <circle cx="76" cy="38" r="1" className="animate-pulse" />
              <circle cx="68" cy="62" r="1.3" />
            </g>
          )}

          {/* HUD Tech Frame Overlay & Corner Markers */}
          <path
            d="M3 10 L3 3 L10 3 M97 10 L97 3 L90 3 M3 90 L3 97 L10 97 M97 90 L97 97 L90 97"
            fill="none"
            stroke={isAlarmed ? '#f43f5e' : isFascinated ? '#06b6d4' : '#38bdf8'}
            strokeWidth="1.8"
          />

          {/* Status Label Inside HUD */}
          <text
            x="50"
            y="12"
            textAnchor="middle"
            fill={isAlarmed ? '#fda4af' : isFascinated ? '#67e8f9' : '#94a3b8'}
            fontSize="5.5"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="0.8"
          >
            {isAlarmed ? '⚠️ ANOMALY HAZARD' : isFascinated ? '✨ FASCINATED' : 'ELARA // SCI'}
          </text>
        </svg>

        {/* Scanline CRT overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-40" />

        {/* Live Heart Rate Telemetry Pip (Bottom Left) */}
        <div className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/75 border border-white/10 text-[8px] font-terminal text-slate-300">
          <Heart
            className={`w-2.5 h-2.5 ${
              isAlarmed
                ? 'text-rose-400 animate-ping'
                : isFascinated
                ? 'text-cyan-400 animate-pulse'
                : 'text-indigo-400'
            }`}
          />
          <span className="font-mono text-[8px]">{heartRate}</span>
        </div>

        {/* Curiosity / Stress Pill (Bottom Right) */}
        <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/75 border border-white/10 text-[8px] font-terminal">
          <span
            className={`font-bold ${
              isAlarmed
                ? 'text-rose-400'
                : isFascinated
                ? 'text-cyan-300'
                : 'text-indigo-300'
            }`}
          >
            {isAlarmed ? `${stress}% STR` : `${curiosity}% CUR`}
          </span>
        </div>

        {/* Subtle Idle Conversation Topic UI Badge */}
        {hasIdleTopic && (
          <div
            className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center w-5 h-5 rounded-full bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/60 ring-2 ring-slate-950 animate-bounce"
            title={idleTopicSnippet ? `New Topic: ${idleTopicSnippet}` : 'New idle conversation topic available!'}
          >
            <MessageSquare className="w-2.5 h-2.5 fill-current" />
          </div>
        )}
      </div>

      {/* Optional Sub-badge */}
      {showStatusBadge && (
        <div className="mt-1 text-center">
          <span
            className={`inline-block text-[9px] font-terminal px-1.5 py-0.5 rounded border uppercase tracking-wider ${
              isAlarmed
                ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse'
                : isFascinated
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-600'
            }`}
          >
            {effectiveEmotion}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Officer Dossier & Biometrics Inspection Modal.
 * Opens when captain clicks any crew portrait to inspect psychological state,
 * test/simulate facial expressions, and trigger direct comms.
 */
interface OfficerDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  officer: CharacterType;
  crew: CrewStatus;
  onSendCommand?: (command: string) => void;
  activeTopic?: IdleTopic | null;
  onSelectTopic?: (topic: IdleTopic) => void;
}

export const OfficerDossierModal: React.FC<OfficerDossierModalProps> = ({
  isOpen,
  onClose,
  officer,
  crew,
  onSendCommand,
  activeTopic,
  onSelectTopic,
}) => {
  const [previewEmotion, setPreviewEmotion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagenStatus, setImagenStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const isJax = officer === 'Jax';

  const jaxCurrentEmotion =
    crew.jaxStatus === 'Panicking' || crew.jaxStress > 70
      ? 'Panicking'
      : crew.jaxStatus === 'Stressed' || crew.jaxStress > 35
      ? 'Stressed'
      : 'Nominal';

  const elaraCurrentEmotion =
    crew.elaraStatus === 'Alarmed' || (crew.elaraStress ?? 12) > 65
      ? 'Alarmed'
      : crew.elaraCuriosity > 75
      ? 'Fascinated'
      : crew.elaraCuriosity > 45
      ? 'Intrigued'
      : 'Analytical';

  const activeEmotion = previewEmotion || (isJax ? jaxCurrentEmotion : elaraCurrentEmotion);
  const stress = isJax ? crew.jaxStress : crew.elaraStress ?? 12;
  const heartRate = isJax
    ? Math.round(68 + (stress / 100) * 88)
    : Math.round(62 + (stress / 100) * 78);

  const handleTestHail = () => {
    if (onSendCommand) {
      if (isJax) {
        onSendCommand('Jax, give me a status report on your stress and engine conditions.');
      } else {
        onSendCommand('Elara, report your current stress level and sensor observations.');
      }
      onClose();
    }
  };

  const handleGenerateImagen = async () => {
    setIsGenerating(true);
    setImagenStatus('Requesting Imagen generation for current emotional expression...');
    try {
      const res = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: officer,
          emotion: activeEmotion,
          stress,
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setImagenStatus('Imagen portrait generated successfully!');
      } else {
        setImagenStatus(
          data.message ||
            'Real-time vector portrait system active. (Imagen API requires paid billing or enterprise quota; dynamic 2D vector expressions are actively rendering).'
        );
      }
    } catch {
      setImagenStatus(
        'Vector rendering engine running at peak fidelity. Dynamic expressions are updating in real-time!'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-fade-in">
      <div className="bg-[#090d18] border border-cyan-500/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-cyan-900/50 flex items-center justify-between bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold font-display uppercase tracking-widest text-slate-100 flex items-center gap-2">
                <span>BRIDGE OFFICER BIOMETRIC DOSSIER</span>
                <span className="text-[10px] font-terminal px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-300">
                  // {officer.toUpperCase()}
                </span>
              </h2>
              <span className="text-[11px] text-slate-400 font-terminal">
                {isJax
                  ? 'CHIEF STARSHIP ENGINEER // POWER SYSTEMS & REACTOR INTEGRITY'
                  : 'CHIEF SCIENCE OFFICER // ASTROMETRICS & DEFLECTOR HARMONICS'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Top Section: Large Portrait & Biometrics Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            {/* The Expressive 2D Portrait at Large 120px Size */}
            <div className="shrink-0 flex flex-col items-center">
              {isJax ? (
                <JaxPortrait
                  stress={stress}
                  status={crew.jaxStatus}
                  size={120}
                  overrideEmotion={previewEmotion as any}
                  interactive={false}
                />
              ) : (
                <ElaraPortrait
                  stress={stress}
                  curiosity={crew.elaraCuriosity}
                  status={crew.elaraStatus}
                  size={120}
                  overrideEmotion={previewEmotion as any}
                  interactive={false}
                />
              )}
              <span className="text-[10px] font-terminal text-cyan-400 mt-2 uppercase tracking-wider">
                LIVE FACIAL TELEMETRY
              </span>
            </div>

            {/* Officer Vital Readings & Emotional Matrix */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-display">
                    {isJax ? 'Lieutenant Jax Thorne' : 'Dr. Elara Vance'}
                  </h3>
                  <span className="text-xs font-terminal text-slate-400">
                    STATUS: <strong className="text-cyan-300">{activeEmotion.toUpperCase()}</strong>
                  </span>
                </div>
                <span
                  className={`text-xs font-terminal px-2 py-1 rounded font-bold uppercase border ${
                    activeEmotion === 'Panicking' || activeEmotion === 'Alarmed'
                      ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                      : activeEmotion === 'Stressed'
                      ? 'bg-amber-950 text-amber-300 border-amber-500'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  }`}
                >
                  {activeEmotion}
                </span>
              </div>

              {/* Heart Rate & Stress Meters */}
              <div className="grid grid-cols-2 gap-2 text-xs font-terminal">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-rose-400 mb-1">
                    <Heart className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-[10px] text-slate-400">HEART RATE</span>
                  </div>
                  <span className="text-base font-bold font-mono text-slate-100">{heartRate} BPM</span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        heartRate > 130 ? 'bg-rose-500' : heartRate > 95 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, (heartRate / 180) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] text-slate-400">STRESS INDEX</span>
                  </div>
                  <span className="text-base font-bold font-mono text-slate-100">{stress}%</span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stress > 70 ? 'bg-rose-500' : stress > 35 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${stress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Metric: Reactor affinity for Jax, Curiosity for Elara */}
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-terminal">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{isJax ? 'WARP COIL AFFINITY' : 'COSMIC CURIOSITY INDEX'}</span>
                  <span className="text-cyan-300 font-bold">{isJax ? '94%' : `${crew.elaraCuriosity}%`}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all"
                    style={{ width: `${isJax ? 94 : crew.elaraCuriosity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Idle Conversation Topic Available Section */}
          {activeTopic && activeTopic.officer === officer && (
            <div className={`p-3 rounded-xl border ${
              isJax
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                : 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
            } space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold font-display uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>CURRENT TRAIN OF THOUGHT // NEW TOPIC</span>
                </div>
                <span className="text-[10px] font-terminal uppercase px-1.5 py-0.5 rounded bg-black/40 border border-current">
                  {activeTopic.category}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold font-display text-slate-100">{activeTopic.title}</h4>
                <p className="text-xs text-slate-300 italic mt-0.5">&ldquo;{activeTopic.snippet}&rdquo;</p>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] font-terminal text-slate-400 truncate">
                  Prompt: &quot;{activeTopic.promptSuggestion}&quot;
                </span>
                <button
                  onClick={() => {
                    if (onSelectTopic) {
                      onSelectTopic(activeTopic);
                    } else if (onSendCommand) {
                      onSendCommand(activeTopic.promptSuggestion);
                    }
                    onClose();
                  }}
                  className={`px-3 py-1 rounded text-xs font-terminal font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isJax
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 fill-current" />
                  <span>DISCUSS NOW</span>
                </button>
              </div>
            </div>
          )}

          {/* Facial Expression Simulator Controls */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>EXPRESSION & EMOTION SIMULATOR</span>
              </span>
              {previewEmotion && (
                <button
                  onClick={() => setPreviewEmotion(null)}
                  className="text-[10px] font-terminal text-cyan-400 hover:underline"
                >
                  Reset to Live Telemetry
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Test how {officer}&apos;s 2D headshot portrait adapts features (brows, eyes, cybernetics, mouth,
              sweat, warning strobes) across different emotional states:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {isJax ? (
                <>
                  <button
                    onClick={() => setPreviewEmotion('Nominal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal border transition-all ${
                      activeEmotion === 'Nominal'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nominal (Focused Smirk)
                  </button>
                  <button
                    onClick={() => setPreviewEmotion('Stressed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal border transition-all ${
                      activeEmotion === 'Stressed'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Stressed (Clenched Teeth & Sweat)
                  </button>
                  <button
                    onClick={() => setPreviewEmotion('Panicking')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal border transition-all ${
                      activeEmotion === 'Panicking'
                        ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Panicking (Shouting & Emergency Strobe)
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setPreviewEmotion('Analytical')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal border transition-all ${
                      activeEmotion === 'Analytical'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Analytical (Stoic & Scanning)
                  </button>
                  <button
                    onClick={() => setPreviewEmotion('Intrigued')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal border transition-all ${
                      activeEmotion === 'Intrigued'
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Intrigued (Curious Gaze)
                  </button>
                  <button
                    onClick={() => setPreviewEmotion('Fascinated')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal border transition-all ${
                      activeEmotion === 'Fascinated'
                        ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Fascinated (Cosmic Starlight Wonder)
                  </button>
                  <button
                    onClick={() => setPreviewEmotion('Alarmed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal border transition-all ${
                      activeEmotion === 'Alarmed'
                        ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Alarmed (Visor Glitch & Warning Strobes)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Imagen AI Generation Request Panel */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>IMAGEN PORTRAIT GENERATION SYNTHESIS</span>
              </span>
              <button
                onClick={handleGenerateImagen}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-terminal text-[11px] font-bold transition-colors cursor-pointer"
              >
                {isGenerating ? 'Synthesizing...' : 'Request Imagen Render'}
              </button>
            </div>
            {imagenStatus && (
              <p className="text-[11px] font-terminal text-cyan-200/90 leading-relaxed bg-black/40 p-2 rounded border border-cyan-800/30">
                {imagenStatus}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-cyan-900/50 bg-[#070b14] flex items-center justify-between">
          <button
            onClick={handleTestHail}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-terminal font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>HAIL OFFICER & ASK STATUS</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-terminal transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
