import React, { useState, useEffect, useMemo } from 'react';
import { ShipState, CrewStatus, Encounter } from '../types';
import {
  Shield,
  Zap,
  Gauge,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Radio,
  Wind,
  Cpu,
  Flame,
  Wrench,
  Sparkles,
  RefreshCw,
  X,
  Crosshair,
  Compass,
  CheckCircle2,
  ChevronRight,
  Eye,
  Sliders,
  Maximize2,
  Layers,
} from 'lucide-react';
import { sound } from '../utils/audio';

export type SubsystemId = 'engines' | 'lifeSupport' | 'sensors' | 'shields' | 'reactor' | 'hull';

export interface SubsystemStatus {
  id: SubsystemId;
  name: string;
  category: 'PROPULSION' | 'ENVIRONMENT' | 'ASTROMETRICS' | 'DEFENSE' | 'POWER' | 'STRUCTURE';
  officer: 'Jax' | 'Elara';
  health: number; // 0 to 100
  status: 'NOMINAL' | 'DEGRADED' | 'HAZARD' | 'CRITICAL';
  statusColor: string;
  statusBorderColor: string;
  statusBgColor: string;
  description: string;
  diagnostics: string[];
  powerDrawKw: number;
  temperatureC: number;
  suggestedPrompt: string;
  locationLabel: string;
}

export interface ShipSchematicsProps {
  ship: ShipState;
  crew?: CrewStatus;
  encounter?: Encounter | null;
  mode?: 'overlay' | 'full' | 'compact';
  onClose?: () => void;
  onSendCommand?: (command: string) => void;
  className?: string;
}

export const ShipSchematics: React.FC<ShipSchematicsProps> = ({
  ship,
  crew,
  encounter,
  mode = 'overlay',
  onClose,
  onSendCommand,
  className = '',
}) => {
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<SubsystemId>('engines');
  const [hoveredSubsystemId, setHoveredSubsystemId] = useState<SubsystemId | null>(null);
  const [viewAngle, setViewAngle] = useState<'dorsal' | 'lateral'>('dorsal');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanLaserY, setScanLaserY] = useState<number>(-20);
  const [showWireframeGrid, setShowWireframeGrid] = useState<boolean>(true);
  const [showInternalConduits, setShowInternalConduits] = useState<boolean>(true);

  // Compute real-time dynamic status for all subsystems based on ship health, speed, encounters, etc.
  const subsystems = useMemo<Record<SubsystemId, SubsystemStatus>>(() => {
    // 1. ENGINE (Propulsion, Warp Coils, Reaction Thrusters)
    let engineHealth = Math.round(ship.hull * 0.7 + ship.energy * 0.3);
    if (ship.speed >= 4) {
      engineHealth = Math.max(12, engineHealth - 14); // Over-throttle heat load
    }
    if (ship.hull < 30) {
      engineHealth = Math.min(engineHealth, Math.round(ship.hull * 1.1));
    }
    const engineStatus: SubsystemStatus['status'] =
      engineHealth > 75 ? 'NOMINAL' : engineHealth > 45 ? 'DEGRADED' : engineHealth > 22 ? 'HAZARD' : 'CRITICAL';

    // 2. LIFE SUPPORT (Atmospheric scrubbers, artificial gravity plates, thermal regulation)
    let lifeSupportHealth = Math.round(ship.hull * 0.82 + (ship.energy > 30 ? 18 : ship.energy * 0.5));
    if (crew && (crew.jaxStress > 80 || (crew.elaraStress ?? 12) > 80)) {
      lifeSupportHealth = Math.max(10, lifeSupportHealth - 12);
    }
    const lifeSupportStatus: SubsystemStatus['status'] =
      lifeSupportHealth > 78 ? 'NOMINAL' : lifeSupportHealth > 50 ? 'DEGRADED' : lifeSupportHealth > 24 ? 'HAZARD' : 'CRITICAL';

    // 3. SENSORS (Astrometric suite, subspace lidar, quantum radiometer array)
    let sensorHealth = Math.round(ship.energy * 0.65 + ship.hull * 0.35);
    if (encounter && encounter.active) {
      if (encounter.type === 'ion_storm' || encounter.type === 'spatial_anomaly') {
        sensorHealth = Math.max(15, sensorHealth - 25);
      } else if (encounter.dangerLevel === 'Extreme') {
        sensorHealth = Math.max(20, sensorHealth - 15);
      }
    }
    const sensorStatus: SubsystemStatus['status'] =
      sensorHealth > 75 ? 'NOMINAL' : sensorHealth > 48 ? 'DEGRADED' : sensorHealth > 25 ? 'HAZARD' : 'CRITICAL';

    // 4. DEFLECTOR SHIELDS
    const shieldHealth = Math.round(ship.shields);
    const shieldStatus: SubsystemStatus['status'] =
      shieldHealth > 70 ? 'NOMINAL' : shieldHealth > 35 ? 'DEGRADED' : shieldHealth > 0 ? 'HAZARD' : 'CRITICAL';

    // 5. REACTOR CORE
    const reactorHealth = Math.round(ship.energy * 0.85 + (ship.hull > 50 ? 15 : ship.hull * 0.3));
    const reactorStatus: SubsystemStatus['status'] =
      reactorHealth > 70 ? 'NOMINAL' : reactorHealth > 40 ? 'DEGRADED' : reactorHealth > 20 ? 'HAZARD' : 'CRITICAL';

    // 6. HULL PLATING & BULKHEADS
    const hullHealth = Math.round(ship.hull);
    const hullStatus: SubsystemStatus['status'] =
      hullHealth > 75 ? 'NOMINAL' : hullHealth > 45 ? 'DEGRADED' : hullHealth > 20 ? 'HAZARD' : 'CRITICAL';

    const getColors = (status: SubsystemStatus['status']) => {
      switch (status) {
        case 'NOMINAL':
          return {
            statusColor: '#10b981', // emerald
            statusBorderColor: 'border-emerald-500/60',
            statusBgColor: 'bg-emerald-950/40 text-emerald-300',
          };
        case 'DEGRADED':
          return {
            statusColor: '#f59e0b', // amber
            statusBorderColor: 'border-amber-500/60',
            statusBgColor: 'bg-amber-950/40 text-amber-300',
          };
        case 'HAZARD':
          return {
            statusColor: '#f97316', // orange
            statusBorderColor: 'border-orange-500/60',
            statusBgColor: 'bg-orange-950/40 text-orange-300',
          };
        case 'CRITICAL':
        default:
          return {
            statusColor: '#ef4444', // crimson red
            statusBorderColor: 'border-rose-500/80',
            statusBgColor: 'bg-rose-950/50 text-rose-300',
          };
      }
    };

    const engineColors = getColors(engineStatus);
    const lifeSupportColors = getColors(lifeSupportStatus);
    const sensorColors = getColors(sensorStatus);
    const shieldColors = getColors(shieldStatus);
    const reactorColors = getColors(reactorStatus);
    const hullColors = getColors(hullStatus);

    return {
      engines: {
        id: 'engines',
        name: 'Propulsion & Warp Drive',
        category: 'PROPULSION',
        officer: 'Jax',
        health: engineHealth,
        status: engineStatus,
        ...engineColors,
        description: 'Dual sub-light fusion manifolds and twin warp nacelle coil assemblies.',
        diagnostics: [
          `Throttle: ${ship.speed * 20}% rated sub-light velocity`,
          `Plasma flow rate: ${engineHealth > 50 ? '98.4% nominal' : '71.2% restricted'}`,
          ship.speed >= 4 ? 'WARNING: High thermal loading on aft vector nozzles' : 'Nozzle cooling within tolerance',
          ship.hull < 30 ? 'ALERT: Nacelle mounting bracket micro-fractures detected' : 'Magnetic strut alignment true',
        ],
        powerDrawKw: Math.round(180 + ship.speed * 140),
        temperatureC: Math.round(420 + ship.speed * 180 + (100 - engineHealth) * 3),
        suggestedPrompt: 'Jax, run full diagnostic on sub-light engine manifolds and balance plasma flow.',
        locationLabel: 'AFT NACELLES // FRAMES 70-98',
      },
      lifeSupport: {
        id: 'lifeSupport',
        name: 'Life Support & Atmosphere',
        category: 'ENVIRONMENT',
        officer: 'Jax',
        health: lifeSupportHealth,
        status: lifeSupportStatus,
        ...lifeSupportColors,
        description: 'Atmospheric O2/CO2 recyclers, gravity plates, and thermal stabilization cells.',
        diagnostics: [
          `Atmospheric pressure: ${lifeSupportHealth > 40 ? '101.3 kPa standard' : '88.1 kPa DEPRESSURIZING'}`,
          `Oxygen scrubber efficiency: ${lifeSupportHealth}%`,
          `Gravity plate dampening: ${lifeSupportHealth > 50 ? '1.00 G stable' : '0.84 G fluctuating'}`,
          ship.hull < 40 ? 'WARNING: Section 4 emergency pressure bulkheads sealed' : 'Bulkhead seals locked',
        ],
        powerDrawKw: 65,
        temperatureC: 21,
        suggestedPrompt: 'Jax, check life support atmospheric scrubbers and gravity plate stability.',
        locationLabel: 'MIDSHIP DECK 02 // FRAMES 35-58',
      },
      sensors: {
        id: 'sensors',
        name: 'Astrometric & Lidar Sensors',
        category: 'ASTROMETRICS',
        officer: 'Elara',
        health: sensorHealth,
        status: sensorStatus,
        ...sensorColors,
        description: 'Forward tachyon emitter dish, lateral lidar combs, and subspace resonance antenna.',
        diagnostics: [
          encounter && encounter.active
            ? `Active contact tracking: ${encounter.title} (${Math.round(encounter.distanceRemaining)} km)`
            : 'Long-range radar scanning sector corridor',
          `Sensor array resolution: ${sensorHealth}%`,
          encounter?.type === 'ion_storm' ? 'Severe electromagnetic scattering detected' : 'Noise floor nominal',
          `Quantum radiometer calibration: ${sensorHealth > 60 ? 'Optimal' : 'Drift detected'}`,
        ],
        powerDrawKw: 95,
        temperatureC: -15,
        suggestedPrompt: 'Elara, recalibrate forward subspace sensor array and scan for spatial hazards.',
        locationLabel: 'BOW SPONSON // FRAMES 01-28',
      },
      shields: {
        id: 'shields',
        name: 'Deflector Shield Grid',
        category: 'DEFENSE',
        officer: 'Elara',
        health: shieldHealth,
        status: shieldStatus,
        ...shieldColors,
        description: 'Graviton deflector bubble projector and phase-harmonic hull emitters.',
        diagnostics: [
          `Shield integrity: ${shieldHealth}%`,
          `Phase harmonic frequency: 142.8 MHz`,
          shieldHealth === 0 ? 'CRITICAL: Deflector envelope collapsed! Hull exposed!' : 'Deflector geometry active',
          `Capacitor recharge rate: ${ship.energy > 30 ? '3.5% / sec' : 'Starved for energy'}`,
        ],
        powerDrawKw: Math.round(ship.shields * 2.8),
        temperatureC: Math.round(85 + (100 - shieldHealth) * 1.5),
        suggestedPrompt: 'Elara, reinforce deflector shields and cycle phase harmonics.',
        locationLabel: 'PERIMETER EMITTERS // HULL PERIMETER',
      },
      reactor: {
        id: 'reactor',
        name: 'Matter-Antimatter Core',
        category: 'POWER',
        officer: 'Jax',
        health: reactorHealth,
        status: reactorStatus,
        ...reactorColors,
        description: 'Magnetic containment bottle and dual deuterium-tritium plasma injector banks.',
        diagnostics: [
          `Energy reserves: ${Math.round(ship.energy)}%`,
          `Magnetic confinement field: ${reactorHealth > 50 ? '99.98% stable' : '94.12% stressed'}`,
          ship.energy < 25 ? 'WARNING: Capacitor reserves depleted below emergency threshold' : 'Capacitor bank charged',
          `Thermal dissipation: ${Math.round(100 - (100 - reactorHealth) * 0.6)}%`,
        ],
        powerDrawKw: 450,
        temperatureC: Math.round(850 + (100 - reactorHealth) * 8),
        suggestedPrompt: 'Jax, optimize reactor output and allocate power to key subsystems.',
        locationLabel: 'CENTRAL CORE // FRAME 48',
      },
      hull: {
        id: 'hull',
        name: 'Tritanium Hull & Bulkheads',
        category: 'STRUCTURE',
        officer: 'Jax',
        health: hullHealth,
        status: hullStatus,
        ...hullColors,
        description: 'Multi-layer composite tritanium armor with nanite self-sealing lattice.',
        diagnostics: [
          `Overall structural integrity: ${hullHealth}%`,
          hullHealth < 30 ? 'EMERGENCY: Multiple hull punctures across outer plates!' : 'Micrometeorite deflection holding',
          `Nanite repair drone reserves: ${hullHealth > 50 ? 'Active' : 'Depleted'}`,
          `Deck pressure seals: ${hullHealth < 20 ? 'CRITICAL BREACH' : 'Intact'}`,
        ],
        powerDrawKw: 25,
        temperatureC: -40,
        suggestedPrompt: 'Jax, deploy nanite repair drones to reinforce damaged hull bulkheads.',
        locationLabel: 'OUTER ARMOR // DECKS 01-03',
      },
    };
  }, [ship, crew, encounter]);

  const activeSubsystem = subsystems[selectedSubsystemId];

  // Trigger diagnostic scan laser animation
  const handleTriggerDiagnosticScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    sound.playCommsChirp(1200);

    let currentY = 0;
    const interval = setInterval(() => {
      currentY += 4;
      setScanLaserY(currentY);
      if (currentY >= 420) {
        clearInterval(interval);
        setIsScanning(false);
        setScanLaserY(-20);
        sound.playCommsChirp(1600);
      }
    }, 25);
  };

  const handleSelectSubsystem = (id: SubsystemId) => {
    setSelectedSubsystemId(id);
    sound.playButtonBeep();
  };

  // Helper to get color stroke for subsystem wireframe parts
  const getSubsystemStroke = (id: SubsystemId) => {
    const isSelected = selectedSubsystemId === id;
    const isHovered = hoveredSubsystemId === id;
    const baseColor = subsystems[id].statusColor;
    if (isSelected) return '#38bdf8'; // Bright cyan selection
    if (isHovered) return '#f8fafc'; // White highlight
    return baseColor;
  };

  return (
    <div
      className={`relative flex flex-col bg-[#050811]/95 text-slate-100 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden font-sans select-none transition-all duration-300 ${
        mode === 'overlay'
          ? 'w-full max-w-5xl max-h-[90vh] border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.25)]'
          : 'w-full h-full'
      } ${className}`}
    >
      {/* Sci-Fi Blueprint Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-950 via-[#07101f] to-slate-950 border-b border-cyan-900/50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '18s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold font-display uppercase tracking-widest text-slate-100 flex items-center gap-2">
                <span>SHIP SCHEMATICS // U.S.S. AEGIS-IV</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </h3>
              <span className="text-[10px] font-terminal px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 hidden md:inline">
                DECK-VIEW 2D WIREFRAME
              </span>
            </div>
            <p className="text-[10px] font-terminal text-slate-400">
              REAL-TIME SUBSYSTEM TELEMETRY // SECTOR: {ship.sector}
            </p>
          </div>
        </div>

        {/* Top Actions & Controls */}
        <div className="flex items-center gap-2">
          {/* Diagnostic Laser Scan Button */}
          <button
            onClick={handleTriggerDiagnosticScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-[11px] font-terminal transition-all cursor-pointer disabled:opacity-50"
            title="Perform full ship-wide diagnostic sweep"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">RUN DIAGNOSTIC</span>
          </button>

          {/* View Angle Switcher */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setViewAngle('dorsal')}
              className={`px-2 py-0.5 text-[10px] font-terminal uppercase rounded transition-colors ${
                viewAngle === 'dorsal'
                  ? 'bg-cyan-500/30 text-cyan-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DORSAL
            </button>
            <button
              onClick={() => setViewAngle('lateral')}
              className={`px-2 py-0.5 text-[10px] font-terminal uppercase rounded transition-colors ${
                viewAngle === 'lateral'
                  ? 'bg-cyan-500/30 text-cyan-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LATERAL
            </button>
          </div>

          {/* Close Modal / Dismiss if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors ml-1 cursor-pointer"
              title="Close Schematics Overlay"
              aria-label="Close Schematics Overlay"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Left Wireframe Canvas + Right Subsystem Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-hidden min-h-[380px] lg:min-h-[440px]">
        {/* LEFT / CENTER: Interactive 2D Wireframe Starship Overlay (7 cols on lg) */}
        <div className="lg:col-span-7 relative flex flex-col items-center justify-center p-4 bg-[#03060d] border-b lg:border-b-0 lg:border-r border-cyan-900/40 overflow-hidden">
          {/* Blueprint Grid Background Pattern */}
          {showWireframeGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  radial-gradient(circle, #06b6d4 1px, transparent 1px),
                  linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
              }}
            />
          )}

          {/* Circular Astrometric Radar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
            <div className="w-[300px] h-[300px] rounded-full border border-cyan-500" />
            <div className="w-[420px] h-[420px] rounded-full border border-cyan-500/60" />
            <div className="w-[540px] h-[540px] rounded-full border border-cyan-500/30 border-dashed" />
          </div>

          {/* Laser Diagnostic Scan Sweep Line */}
          {isScanning && (
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] z-20 pointer-events-none transition-all"
              style={{ top: `${scanLaserY}px` }}
            >
              <div className="absolute right-4 -top-5 text-[9px] font-terminal text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded border border-cyan-500/40">
                SWEEP SCANNING: FRAME {Math.round((scanLaserY / 420) * 98)}
              </div>
            </div>
          )}

          {/* Wireframe Overlay SVG (Orthographic Blueprint Vector) */}
          <div className="relative w-full max-w-[480px] aspect-[4/3] max-h-[380px] flex items-center justify-center">
            <svg
              viewBox="0 0 500 400"
              className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.3)] select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Neon Glow Filters */}
                <filter id="wire-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="wire-glow-warn" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Subsystem Linear Gradients */}
                <linearGradient id="laser-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* 1. DEFLECTOR SHIELD BUBBLE (Interactive) */}
              <g
                className="cursor-pointer transition-opacity"
                onClick={() => handleSelectSubsystem('shields')}
                onMouseEnter={() => setHoveredSubsystemId('shields')}
                onMouseLeave={() => setHoveredSubsystemId(null)}
              >
                {ship.shields > 0 ? (
                  <ellipse
                    cx="250"
                    cy="200"
                    rx="225"
                    ry="175"
                    fill="none"
                    stroke={getSubsystemStroke('shields')}
                    strokeWidth={selectedSubsystemId === 'shields' ? '2.5' : '1.5'}
                    strokeDasharray="8 6"
                    opacity={0.7}
                    className="animate-pulse"
                  />
                ) : (
                  <ellipse
                    cx="250"
                    cy="200"
                    rx="225"
                    ry="175"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="3 7"
                    opacity={0.4}
                  />
                )}
                {/* Shield Grid Hex Markers */}
                <circle cx="65" cy="200" r="3" fill={getSubsystemStroke('shields')} opacity="0.6" />
                <circle cx="435" cy="200" r="3" fill={getSubsystemStroke('shields')} opacity="0.6" />
                <circle cx="250" cy="30" r="3" fill={getSubsystemStroke('shields')} opacity="0.6" />
                <circle cx="250" cy="370" r="3" fill={getSubsystemStroke('shields')} opacity="0.6" />
              </g>

              {/* 2. SHIP HULL STRUCTURE & BULKHEADS (Interactive) */}
              <g
                className="cursor-pointer"
                onClick={() => handleSelectSubsystem('hull')}
                onMouseEnter={() => setHoveredSubsystemId('hull')}
                onMouseLeave={() => setHoveredSubsystemId(null)}
              >
                {/* Main Outer Hull Contour: Forward Needle Nose to Wings & Nacelle Struts */}
                <path
                  d="
                    M 250 50
                    L 275 110
                    L 310 160
                    L 400 240
                    L 380 280
                    L 320 270
                    L 290 320
                    L 270 330
                    L 270 360
                    L 230 360
                    L 230 330
                    L 210 320
                    L 180 270
                    L 120 280
                    L 100 240
                    L 190 160
                    L 225 110
                    Z
                  "
                  fill="rgba(6, 182, 212, 0.03)"
                  stroke={getSubsystemStroke('hull')}
                  strokeWidth={selectedSubsystemId === 'hull' ? '2.5' : '1.5'}
                  filter={subsystems.hull.status === 'CRITICAL' ? 'url(#wire-glow-warn)' : 'url(#wire-glow-cyan)'}
                />

                {/* Internal Structural Bulkhead Ribs */}
                <line x1="210" y1="140" x2="290" y2="140" stroke={getSubsystemStroke('hull')} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                <line x1="190" y1="180" x2="310" y2="180" stroke={getSubsystemStroke('hull')} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                <line x1="180" y1="230" x2="320" y2="230" stroke={getSubsystemStroke('hull')} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                <line x1="200" y1="280" x2="300" y2="280" stroke={getSubsystemStroke('hull')} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />

                {/* Longitudinal Centerline Keel Wire */}
                <line x1="250" y1="50" x2="250" y2="360" stroke={getSubsystemStroke('hull')} strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />

                {/* Hull Damage Fracture Lines & Breach Points when health < 60% */}
                {ship.hull < 60 && (
                  <g className="animate-pulse">
                    {/* Stress Fracture on Starboard Wing */}
                    <path d="M 320 210 L 340 230 L 335 245 L 360 255" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <circle cx="340" cy="230" r="3" fill="#f59e0b" />
                  </g>
                )}
                {ship.hull < 30 && (
                  <g>
                    {/* Critical Hull Breach on Port Armor */}
                    <path d="M 170 200 L 155 215 L 140 210 L 130 230" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                    <circle cx="155" cy="215" r="5" fill="#ef4444" className="animate-ping" opacity="0.8" />
                    <circle cx="155" cy="215" r="2.5" fill="#ffffff" />
                  </g>
                )}
              </g>

              {/* 3. SENSORS (Astrometric Bow Dish & Lidar Antennas) (Interactive) */}
              <g
                className="cursor-pointer"
                onClick={() => handleSelectSubsystem('sensors')}
                onMouseEnter={() => setHoveredSubsystemId('sensors')}
                onMouseLeave={() => setHoveredSubsystemId(null)}
              >
                {/* Forward Sensor Dish Arc */}
                <path
                  d="M 230 70 A 25 25 0 0 1 270 70"
                  fill="none"
                  stroke={getSubsystemStroke('sensors')}
                  strokeWidth={selectedSubsystemId === 'sensors' ? '3' : '2'}
                />
                <circle cx="250" cy="62" r="3" fill={getSubsystemStroke('sensors')} />

                {/* Subspace Lidar Emission Cones */}
                <line x1="250" y1="50" x2="230" y2="25" stroke={getSubsystemStroke('sensors')} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                <line x1="250" y1="50" x2="270" y2="25" stroke={getSubsystemStroke('sensors')} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                <line x1="250" y1="50" x2="250" y2="15" stroke={getSubsystemStroke('sensors')} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.8" />

                {/* Port & Starboard Wingtip Sensor Pods */}
                <rect x="94" y="234" width="12" height="12" rx="2" fill="none" stroke={getSubsystemStroke('sensors')} strokeWidth="1.5" />
                <rect x="394" y="234" width="12" height="12" rx="2" fill="none" stroke={getSubsystemStroke('sensors')} strokeWidth="1.5" />
              </g>

              {/* 4. LIFE SUPPORT & BRIDGE COMPARTMENT (Interactive) */}
              <g
                className="cursor-pointer"
                onClick={() => handleSelectSubsystem('lifeSupport')}
                onMouseEnter={() => setHoveredSubsystemId('lifeSupport')}
                onMouseLeave={() => setHoveredSubsystemId(null)}
              >
                {/* Bridge Canopy Capsule */}
                <ellipse
                  cx="250"
                  cy="125"
                  rx="16"
                  ry="24"
                  fill="rgba(6, 182, 212, 0.08)"
                  stroke={getSubsystemStroke('lifeSupport')}
                  strokeWidth={selectedSubsystemId === 'lifeSupport' ? '2.5' : '1.5'}
                />
                {/* Crew Compartment & Life Support Scrubbers */}
                <rect
                  x="232"
                  y="155"
                  width="36"
                  height="26"
                  rx="4"
                  fill="rgba(16, 185, 129, 0.05)"
                  stroke={getSubsystemStroke('lifeSupport')}
                  strokeWidth={selectedSubsystemId === 'lifeSupport' ? '2.5' : '1.5'}
                />
                {/* Life Support Indicator Symbol: Oxygen / Atmospheric Grid */}
                <path d="M 242 168 L 258 168 M 250 160 L 250 176" stroke={getSubsystemStroke('lifeSupport')} strokeWidth="1" opacity="0.7" />
              </g>

              {/* 5. REACTOR CORE & PLASMA CONDUITS (Interactive) */}
              <g
                className="cursor-pointer"
                onClick={() => handleSelectSubsystem('reactor')}
                onMouseEnter={() => setHoveredSubsystemId('reactor')}
                onMouseLeave={() => setHoveredSubsystemId(null)}
              >
                {/* Reactor Core Cylinder Chamber */}
                <circle
                  cx="250"
                  cy="215"
                  r="20"
                  fill="rgba(245, 158, 11, 0.06)"
                  stroke={getSubsystemStroke('reactor')}
                  strokeWidth={selectedSubsystemId === 'reactor' ? '3' : '2'}
                />
                {/* Rotating Magnetic Rings Inside Core */}
                <circle cx="250" cy="215" r="12" fill="none" stroke={getSubsystemStroke('reactor')} strokeWidth="1" strokeDasharray="3 3" className="animate-spin" style={{ transformOrigin: '250px 215px', animationDuration: '8s' }} />
                <circle cx="250" cy="215" r="5" fill={getSubsystemStroke('reactor')} />

                {/* Plasma Conduits routing from Core to Engines */}
                {showInternalConduits && (
                  <g opacity="0.75">
                    <path d="M 235 225 L 175 250 L 155 285" fill="none" stroke={getSubsystemStroke('reactor')} strokeWidth="1.5" strokeDasharray="4 2" />
                    <path d="M 265 225 L 325 250 L 345 285" fill="none" stroke={getSubsystemStroke('reactor')} strokeWidth="1.5" strokeDasharray="4 2" />
                  </g>
                )}
              </g>

              {/* 6. ENGINES & WARP NACELLES (Interactive) */}
              <g
                className="cursor-pointer"
                onClick={() => handleSelectSubsystem('engines')}
                onMouseEnter={() => setHoveredSubsystemId('engines')}
                onMouseLeave={() => setHoveredSubsystemId(null)}
              >
                {/* Port Nacelle */}
                <rect
                  x="138"
                  y="270"
                  width="32"
                  height="75"
                  rx="6"
                  fill="rgba(6, 182, 212, 0.06)"
                  stroke={getSubsystemStroke('engines')}
                  strokeWidth={selectedSubsystemId === 'engines' ? '2.5' : '1.5'}
                />
                <line x1="138" y1="295" x2="170" y2="295" stroke={getSubsystemStroke('engines')} strokeWidth="1" opacity="0.6" />
                <line x1="138" y1="320" x2="170" y2="320" stroke={getSubsystemStroke('engines')} strokeWidth="1" opacity="0.6" />

                {/* Starboard Nacelle */}
                <rect
                  x="330"
                  y="270"
                  width="32"
                  height="75"
                  rx="6"
                  fill="rgba(6, 182, 212, 0.06)"
                  stroke={getSubsystemStroke('engines')}
                  strokeWidth={selectedSubsystemId === 'engines' ? '2.5' : '1.5'}
                />
                <line x1="330" y1="295" x2="362" y2="295" stroke={getSubsystemStroke('engines')} strokeWidth="1" opacity="0.6" />
                <line x1="330" y1="320" x2="362" y2="320" stroke={getSubsystemStroke('engines')} strokeWidth="1" opacity="0.6" />

                {/* Central Sub-Light Thruster Nozzle */}
                <polygon
                  points="235,360 265,360 270,380 230,380"
                  fill="rgba(6, 182, 212, 0.1)"
                  stroke={getSubsystemStroke('engines')}
                  strokeWidth={selectedSubsystemId === 'engines' ? '2.5' : '1.5'}
                />

                {/* Dynamic Engine Exhaust Plumes based on ship speed */}
                {ship.speed > 0 && (
                  <g className="animate-pulse" opacity={0.7 + (ship.speed / 5) * 0.3}>
                    {/* Port Exhaust */}
                    <polygon
                      points={`146,345 162,345 ${154},${355 + ship.speed * 8}`}
                      fill={subsystems.engines.statusColor}
                      opacity="0.6"
                    />
                    {/* Starboard Exhaust */}
                    <polygon
                      points={`338,345 354,345 ${346},${355 + ship.speed * 8}`}
                      fill={subsystems.engines.statusColor}
                      opacity="0.6"
                    />
                    {/* Center Thruster Exhaust */}
                    <polygon
                      points={`235,380 265,380 ${250},${395 + ship.speed * 9}`}
                      fill={subsystems.engines.statusColor}
                      opacity="0.75"
                    />
                  </g>
                )}
              </g>

              {/* Callout Indicator Pin for Currently Selected Subsystem */}
              {selectedSubsystemId === 'sensors' && (
                <g>
                  <circle cx="250" cy="50" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" style={{ transformOrigin: '250px 50px' }} />
                  <line x1="250" y1="50" x2="380" y2="50" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="385" y="54" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">SENSORS</text>
                </g>
              )}
              {selectedSubsystemId === 'lifeSupport' && (
                <g>
                  <circle cx="250" cy="140" r="22" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" style={{ transformOrigin: '250px 140px' }} />
                  <line x1="268" y1="140" x2="380" y2="140" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="385" y="144" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">LIFE SUPPORT</text>
                </g>
              )}
              {selectedSubsystemId === 'reactor' && (
                <g>
                  <circle cx="250" cy="215" r="26" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" className="animate-spin" style={{ transformOrigin: '250px 215px' }} />
                  <line x1="276" y1="215" x2="380" y2="215" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="385" y="219" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">REACTOR CORE</text>
                </g>
              )}
              {selectedSubsystemId === 'engines' && (
                <g>
                  <circle cx="250" cy="340" r="24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" style={{ transformOrigin: '250px 340px' }} />
                  <line x1="275" y1="340" x2="380" y2="340" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="385" y="344" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">PROPULSION</text>
                </g>
              )}
              {selectedSubsystemId === 'shields' && (
                <g>
                  <circle cx="435" cy="200" r="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                  <line x1="435" y1="200" x2="475" y2="180" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="410" y="170" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">SHIELD GRID</text>
                </g>
              )}
              {selectedSubsystemId === 'hull' && (
                <g>
                  <line x1="120" y1="280" x2="50" y2="280" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="15" y="284" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">ARMOR HULL</text>
                </g>
              )}
            </svg>
          </div>

          {/* Bottom Wireframe Controls Ribbon */}
          <div className="w-full flex items-center justify-between pt-2 border-t border-cyan-950/60 text-[11px] font-terminal text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Toggles:</span>
              <button
                onClick={() => setShowWireframeGrid((prev) => !prev)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  showWireframeGrid
                    ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                GRID
              </button>
              <button
                onClick={() => setShowInternalConduits((prev) => !prev)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  showInternalConduits
                    ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                CONDUITS
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-cyan-400/80 text-[10px]">
              <Crosshair className="w-3 h-3" />
              <span>CLICK ANY ZONE TO INSPECT</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Subsystems Real-Time Status & Diagnostics Readout (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-[#060914] overflow-y-auto space-y-4">
          {/* Quick Subsystems Health Matrix */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40 mb-2.5">
              <span className="text-[11px] font-terminal text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>SUBSYSTEM HEALTH MATRIX</span>
              </span>
              <span className="text-[10px] font-terminal text-slate-500">REAL-TIME TELEMETRY</span>
            </div>

            {/* Subsystems List Selector */}
            <div className="space-y-1.5">
              {(['engines', 'lifeSupport', 'sensors', 'shields', 'reactor', 'hull'] as SubsystemId[]).map((id) => {
                const sub = subsystems[id];
                const isSelected = selectedSubsystemId === id;

                return (
                  <div
                    key={id}
                    onClick={() => handleSelectSubsystem(id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-cyan-800 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{
                          backgroundColor: sub.statusColor,
                          boxShadow: `0 0 8px ${sub.statusColor}`,
                        }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold font-display uppercase tracking-wider text-slate-200 truncate flex items-center gap-1.5">
                          <span>{sub.name}</span>
                          {sub.status === 'CRITICAL' && (
                            <span className="text-[9px] font-terminal text-rose-400 animate-pulse font-bold">
                              [CRITICAL]
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-terminal text-slate-500 block truncate">
                          {sub.officer} // {sub.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-14 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(0, Math.min(100, sub.health))}%`,
                            backgroundColor: sub.statusColor,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-terminal font-bold w-9 text-right"
                        style={{ color: sub.statusColor }}
                      >
                        {sub.health}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Subsystem Detailed Diagnostics Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-800/50 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <span className="text-[10px] font-terminal text-cyan-400 tracking-wider uppercase block">
                  SUBSYSTEM INSPECTION // {activeSubsystem.locationLabel}
                </span>
                <h4 className="text-sm font-bold font-display text-slate-100 uppercase tracking-wide">
                  {activeSubsystem.name}
                </h4>
              </div>

              <div
                className={`px-2 py-0.5 rounded text-[10px] font-terminal font-bold uppercase border ${activeSubsystem.statusBgColor} ${activeSubsystem.statusBorderColor}`}
              >
                {activeSubsystem.status}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeSubsystem.description}
            </p>

            {/* Subsystem Telemetry Vitals */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-terminal bg-slate-900/70 p-2 rounded border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[9px]">POWER ALLOCATION</span>
                <span className="text-cyan-300 font-bold">{activeSubsystem.powerDrawKw} kW</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">TEMPERATURE</span>
                <span
                  className={`font-bold ${
                    activeSubsystem.temperatureC > 600
                      ? 'text-rose-400'
                      : activeSubsystem.temperatureC > 300
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {activeSubsystem.temperatureC} °C
                </span>
              </div>
            </div>

            {/* Diagnostic Readout Lines */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-terminal text-slate-400 uppercase tracking-wider block">
                TELEMETRY DIAGNOSTICS LOG:
              </span>
              <div className="space-y-1 bg-black/50 p-2 rounded border border-slate-900 text-[10px] font-mono">
                {activeSubsystem.diagnostics.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                    <span className="text-cyan-500 select-none">&gt;</span>
                    <span className="leading-tight">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Officer Directive Trigger */}
            {onSendCommand && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    onSendCommand(activeSubsystem.suggestedPrompt);
                    if (onClose) onClose();
                  }}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-terminal font-semibold flex items-center justify-between transition-all cursor-pointer shadow-md ${
                    activeSubsystem.officer === 'Jax'
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-200'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/60 text-cyan-200'
                  }`}
                  title={`Send order to ${activeSubsystem.officer}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Wrench className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">DIRECT {activeSubsystem.officer.toUpperCase()}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
