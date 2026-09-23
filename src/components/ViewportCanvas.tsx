import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ShipState,
  Encounter,
  DisplayProperties,
  CameraViewMode,
  VisualSpectrum,
  TacticalTarget,
  ThreatLevel,
} from '../types';
import { SpaceRenderer, SECTOR_VISUAL_PROFILES } from '../game/starfield';
import { sound } from '../utils/audio';
import {
  Compass,
  ShieldAlert,
  Radio,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Sliders,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  CheckCircle2,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { CrewStatus } from '../types';
import { ShipSchematics } from './ShipSchematics';

interface ViewportCanvasProps {
  ship: ShipState;
  encounter: Encounter | null;
  onRendererReady?: (renderer: SpaceRenderer) => void;
  rendererRef: React.MutableRefObject<SpaceRenderer | null>;
  crew?: CrewStatus;
  onSendCommand?: (command: string) => void;
  isSchematicsOpen?: boolean;
  onToggleSchematics?: () => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  ship,
  encounter,
  onRendererReady,
  rendererRef,
  crew,
  onSendCommand,
  isSchematicsOpen,
  onToggleSchematics,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localSchematicsOpen, setLocalSchematicsOpen] = useState<boolean>(false);

  const effectiveSchematicsOpen = isSchematicsOpen !== undefined ? isSchematicsOpen : localSchematicsOpen;
  const handleToggleSchematics = () => {
    if (onToggleSchematics) {
      onToggleSchematics();
    } else {
      setLocalSchematicsOpen((prev) => !prev);
    }
  };

  // Keep latest ship & encounter refs for the RAF loop
  const shipRef = useRef<ShipState>(ship);
  const encounterRef = useRef<Encounter | null>(encounter);
  useEffect(() => {
    shipRef.current = ship;
  }, [ship]);
  useEffect(() => {
    encounterRef.current = encounter;
  }, [encounter]);

  // Local display properties state
  const [displayProps, setDisplayProps] = useState<DisplayProperties>({
    viewMode: 'chase',
    spectrum: 'optical',
    showFlightVectors: true,
    showNavGrid: true,
    showShieldHexes: true,
    showThrusterTrails: true,
    zoomLevel: 1.0,
    dynamicBanking: true,
    bloomEffects: true,
  });

  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);

  // Dynamic HUD Overlay State
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [hudFilter, setHudFilter] = useState<'all' | 'hazards' | 'scans'>('all');
  const [tacticalTargets, setTacticalTargets] = useState<TacticalTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [scanningTargetId, setScanningTargetId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scannedIds, setScannedIds] = useState<Record<string, boolean>>({});
  const [shipScreenPos, setShipScreenPos] = useState<{ x: number; y: number }>({ x: 400, y: 350 });

  // Active Sensor Ping Radar Sweep State
  const [activeSensorPing, setActiveSensorPing] = useState<{
    id: string;
    title: string;
    type: string;
    dangerLevel: string;
    distance: number;
    bearingDeg: number;
    color: string;
  } | null>(null);

  const prevEncounterIdRef = useRef<string | null>(null);
  const sensorPingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger active sensor ping radar sweep
  const triggerSensorPingSweep = useCallback(
    (targetEncounter: Encounter | null) => {
      const isThreat =
        targetEncounter?.dangerLevel === 'Hazardous' || targetEncounter?.dangerLevel === 'Extreme';
      const pingColor = isThreat ? '#f43f5e' : '#06b6d4';

      // Play active radar acoustic ping tone
      sound.playRadarPing(isThreat);

      // Bearing calculation: forward vector slightly offset by hazard signature
      const bearing = targetEncounter
        ? Math.round((Math.sin(targetEncounter.title.length * 3) * 28 + 360) % 360)
        : 0;

      // Trigger radar sweep on the canvas renderer
      if (rendererRef.current) {
        rendererRef.current.triggerRadarSweep(
          undefined,
          pingColor,
          () => {
            // Secondary contact acquisition confirmation chirp
            sound.playCommsChirp(1350);
          }
        );
        rendererRef.current.triggerScan();
      }

      if (targetEncounter) {
        setActiveSensorPing({
          id: targetEncounter.id,
          title: targetEncounter.title,
          type: targetEncounter.type,
          dangerLevel: targetEncounter.dangerLevel,
          distance: Math.round(targetEncounter.distanceRemaining),
          bearingDeg: bearing,
          color: pingColor,
        });

        if (sensorPingTimerRef.current) {
          clearTimeout(sensorPingTimerRef.current);
        }
        sensorPingTimerRef.current = setTimeout(() => {
          setActiveSensorPing(null);
        }, 3400);
      }
    },
    [rendererRef]
  );

  // Detect when a new encounter arrives to fire the active sensor radar ping animation
  useEffect(() => {
    if (encounter && encounter.active && encounter.id !== prevEncounterIdRef.current) {
      prevEncounterIdRef.current = encounter.id;
      triggerSensorPingSweep(encounter);
    } else if (!encounter) {
      prevEncounterIdRef.current = null;
      setActiveSensorPing(null);
    }
  }, [encounter, triggerSensorPingSweep]);

  // Cleanup sensor ping timer on unmount
  useEffect(() => {
    return () => {
      if (sensorPingTimerRef.current) {
        clearTimeout(sensorPingTimerRef.current);
      }
    };
  }, []);

  // Sync state into renderer
  const updateDisplayProps = useCallback(
    (updates: Partial<DisplayProperties>) => {
      setDisplayProps((prev) => {
        const next = { ...prev, ...updates };
        if (rendererRef.current) {
          rendererRef.current.setDisplayProperties(next);
        }
        return next;
      });
    },
    [rendererRef]
  );

  // Setup Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new SpaceRenderer(canvas);
    rendererRef.current = renderer;
    renderer.setDisplayProperties(displayProps);
    if (onRendererReady) onRendererReady(renderer);

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    let animId: number;
    let lastHudSync = 0;

    const loop = (now: number) => {
      const currentShip = shipRef.current;
      const currentEncounter = encounterRef.current;

      renderer.render(currentShip, currentEncounter, now);

      // Throttle HUD targets state sync to ~30-40fps for optimal performance
      if (now - lastHudSync > 28) {
        lastHudSync = now;
        const targets = renderer.getTacticalTargets(currentShip, currentEncounter, now);
        setTacticalTargets(targets);
        setShipScreenPos(renderer.getShipScreenPosition());
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cycle to next tactical target
  const cycleNextTarget = useCallback(() => {
    if (tacticalTargets.length === 0) return;
    const currentIndex = tacticalTargets.findIndex((t) => t.id === selectedTargetId);
    const nextIndex = (currentIndex + 1) % tacticalTargets.length;
    const nextTarget = tacticalTargets[nextIndex];
    setSelectedTargetId(nextTarget.id);
    sound.playCommsChirp(1150);
  }, [tacticalTargets, selectedTargetId]);

  // Keyboard navigation: TAB cycles targets, ESC clears lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        cycleNextTarget();
      } else if (e.key === 'Escape') {
        setSelectedTargetId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleNextTarget]);

  // Cleanup scan interval on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Pointer move handler for responsive interactive steering & flight dynamics
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !rendererRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize from -1 to +1 relative to center
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.72) * 2;

    rendererRef.current.setSteeringInput(
      Math.max(-1, Math.min(1, normX)),
      Math.max(-1, Math.min(1, normY))
    );
  };

  const handlePointerLeave = () => {
    if (rendererRef.current) {
      rendererRef.current.resetSteering();
    }
  };

  const handleTriggerScan = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerSensorPingSweep(encounterRef.current);

    // If a target is currently locked, also perform focused scan
    if (selectedTargetId) {
      startTargetScan(selectedTargetId);
    }
  };

  const handleZoomChange = (delta: number) => {
    const newZoom = Math.max(
      0.75,
      Math.min(1.5, Math.round((displayProps.zoomLevel + delta) * 100) / 100)
    );
    updateDisplayProps({ zoomLevel: newZoom });
  };

  // Target lock selection
  const handleSelectTarget = (targetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedTargetId === targetId) {
      // Toggle or keep
    } else {
      setSelectedTargetId(targetId);
      sound.playCommsChirp(1200);
    }
  };

  // Initiate focused scan on a target
  const startTargetScan = (targetId: string) => {
    if (scanningTargetId) return;
    setScanningTargetId(targetId);
    setScanProgress(0);
    sound.playScan();

    if (rendererRef.current) {
      rendererRef.current.triggerScan();
    }

    let p = 0;
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    scanIntervalRef.current = setInterval(() => {
      p += 10;
      setScanProgress(p);
      if (p >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        setScanningTargetId(null);
        setScannedIds((prev) => ({ ...prev, [targetId]: true }));
        if (rendererRef.current) {
          rendererRef.current.scanTarget(targetId);
        }
        sound.playCommsChirp(1400);
      }
    }, 120);
  };

  // Filter targets based on HUD filter mode
  const filteredTargets = tacticalTargets.filter((t) => {
    if (hudFilter === 'hazards') return t.type === 'hazard';
    if (hudFilter === 'scans') return t.type === 'scan_target' || t.type === 'celestial';
    return true;
  });

  const selectedTarget = tacticalTargets.find((t) => t.id === selectedTargetId);

  // Counts for HUD toolbar
  const hazardCount = tacticalTargets.filter((t) => t.type === 'hazard').length;
  const scanCount = tacticalTargets.filter(
    (t) => t.type === 'scan_target' || t.type === 'celestial'
  ).length;

  // Most critical hazard proximity alert
  const criticalHazard = tacticalTargets.find(
    (t) => t.type === 'hazard' && t.threatLevel === 'CRITICAL' && t.distanceKm <= 35
  );

  return (
    <div
      id="viewport-container"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-full min-h-[320px] bg-[#04060d] border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between cursor-crosshair select-none"
    >
      {/* 60fps High-Resolution Canvas Stage */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* CRT Scanline & Subtle Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-cyan-950/[0.08] via-transparent to-black/40" />
      <div className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-30" />

      {/* ========================================================================= */}
      {/* DYNAMIC TACTICAL HUD OVERLAY LAYER (Brackets, Reticles, Telemetry Lines)  */}
      {/* ========================================================================= */}
      {isHudVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {/* 1. Trajectory Vector Beam to Selected Target */}
          {selectedTarget && !selectedTarget.isOffScreen && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="targetBeamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor={selectedTarget.threatColor} stopOpacity="0.9" />
                </linearGradient>
              </defs>
              {/* Pulsing targeting vector line */}
              <line
                x1={shipScreenPos.x}
                y1={shipScreenPos.y - 25}
                x2={selectedTarget.x}
                y2={selectedTarget.y}
                stroke="url(#targetBeamGrad)"
                strokeWidth="1.5"
                strokeDasharray="5 7"
                className="animate-pulse"
              />
              {/* Range badge midway on beam */}
              <g
                transform={`translate(${(shipScreenPos.x + selectedTarget.x) / 2}, ${(shipScreenPos.y - 25 + selectedTarget.y) / 2})`}
              >
                <rect
                  x="-36"
                  y="-10"
                  width="72"
                  height="20"
                  rx="4"
                  fill="#030712"
                  fillOpacity="0.85"
                  stroke={selectedTarget.threatColor}
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="4"
                  fill={selectedTarget.threatColor}
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {selectedTarget.distanceKm} KM
                </text>
              </g>
            </svg>
          )}

          {/* 2. Tactical Bracket Markers for On-Screen Targets */}
          {filteredTargets.map((target) => {
            const isSelected = target.id === selectedTargetId;
            const isScanning = scanningTargetId === target.id;
            const isScanned = target.scanned || scannedIds[target.id];

            // Size bracket to enclose target radius with comfortable aerospace margin
            const bracketSize = Math.max(54, Math.min(128, target.radius * 2.3));
            const halfSize = bracketSize / 2;
            const cornerLength = Math.max(10, Math.round(bracketSize * 0.22));

            // Target Classification colors
            const themeColor = target.threatColor;

            if (target.isOffScreen) {
              // Off-Screen Perimeter Edge Indicator
              const angleDeg = ((target.edgeAngle || 0) * 180) / Math.PI;

              return (
                <div
                  key={`off-${target.id}`}
                  onClick={(e) => handleSelectTarget(target.id, e)}
                  style={{
                    left: `${target.edgeX}px`,
                    top: `${target.edgeY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute pointer-events-auto cursor-pointer group flex items-center gap-1.5 transition-transform hover:scale-110"
                >
                  <div
                    style={{
                      borderColor: themeColor,
                      backgroundColor: 'rgba(3, 7, 18, 0.9)',
                      boxShadow: `0 0 10px ${themeColor}40`,
                    }}
                    className="px-2 py-1 rounded border text-[9px] font-mono flex items-center gap-1 text-slate-200"
                  >
                    <div
                      style={{
                        transform: `rotate(${angleDeg}deg)`,
                        color: themeColor,
                      }}
                      className="font-bold text-xs"
                    >
                      ▶
                    </div>
                    <span className="font-semibold">{target.category}</span>
                    <span style={{ color: themeColor }} className="font-bold">
                      {target.distanceKm}KM
                    </span>
                  </div>
                </div>
              );
            }

            // On-Screen Precision Tactical Bracket
            return (
              <div
                key={target.id}
                onClick={(e) => handleSelectTarget(target.id, e)}
                style={{
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  width: `${bracketSize}px`,
                  height: `${bracketSize}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute pointer-events-auto cursor-pointer group transition-all duration-100 ${
                  isSelected ? 'z-30' : 'z-20 hover:z-25'
                }`}
              >
                {/* Tactical SVG Corner Brackets */}
                <svg
                  className="absolute inset-0 w-full h-full overflow-visible"
                  viewBox={`0 0 ${bracketSize} ${bracketSize}`}
                >
                  {/* Outer glowing halo when selected */}
                  {isSelected && (
                    <rect
                      x="-6"
                      y="-6"
                      width={bracketSize + 12}
                      height={bracketSize + 12}
                      fill="none"
                      stroke={themeColor}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="animate-spin-slow opacity-60"
                      rx="8"
                    />
                  )}

                  {/* Corner Brackets: Top-Left */}
                  <path
                    d={`M 0 ${cornerLength} L 0 0 L ${cornerLength} 0`}
                    fill="none"
                    stroke={themeColor}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                    strokeLinecap="square"
                    style={{ filter: `drop-shadow(0 0 4px ${themeColor})` }}
                  />

                  {/* Corner Brackets: Top-Right */}
                  <path
                    d={`M ${bracketSize - cornerLength} 0 L ${bracketSize} 0 L ${bracketSize} ${cornerLength}`}
                    fill="none"
                    stroke={themeColor}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                    strokeLinecap="square"
                    style={{ filter: `drop-shadow(0 0 4px ${themeColor})` }}
                  />

                  {/* Corner Brackets: Bottom-Right */}
                  <path
                    d={`M ${bracketSize} ${bracketSize - cornerLength} L ${bracketSize} ${bracketSize} L ${bracketSize - cornerLength} ${bracketSize}`}
                    fill="none"
                    stroke={themeColor}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                    strokeLinecap="square"
                    style={{ filter: `drop-shadow(0 0 4px ${themeColor})` }}
                  />

                  {/* Corner Brackets: Bottom-Left */}
                  <path
                    d={`M ${cornerLength} ${bracketSize} L 0 ${bracketSize} L 0 ${bracketSize - cornerLength}`}
                    fill="none"
                    stroke={themeColor}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                    strokeLinecap="square"
                    style={{ filter: `drop-shadow(0 0 4px ${themeColor})` }}
                  />

                  {/* Center Crosshair Pip */}
                  <line
                    x1={halfSize - 4}
                    y1={halfSize}
                    x2={halfSize + 4}
                    y2={halfSize}
                    stroke={themeColor}
                    strokeWidth="1"
                  />
                  <line
                    x1={halfSize}
                    y1={halfSize - 4}
                    x2={halfSize}
                    y2={halfSize + 4}
                    stroke={themeColor}
                    strokeWidth="1"
                  />

                  {/* Center Reticle Ring when locked */}
                  {isSelected && (
                    <circle
                      cx={halfSize}
                      cy={halfSize}
                      r={Math.max(12, halfSize * 0.45)}
                      fill="none"
                      stroke={themeColor}
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                  )}
                </svg>

                {/* Top Badge: Classification Header */}
                <div
                  style={{
                    backgroundColor: 'rgba(2, 6, 23, 0.92)',
                    borderColor: themeColor,
                    boxShadow: isSelected ? `0 0 12px ${themeColor}60` : undefined,
                  }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded border text-[9px] font-mono tracking-wider whitespace-nowrap flex items-center gap-1 text-slate-200"
                >
                  {target.type === 'hazard' ? (
                    <AlertTriangle
                      style={{ color: themeColor }}
                      className="w-2.5 h-2.5 animate-pulse"
                    />
                  ) : target.type === 'scan_target' ? (
                    <Crosshair style={{ color: themeColor }} className="w-2.5 h-2.5" />
                  ) : target.type === 'celestial' ? (
                    <Sparkles style={{ color: themeColor }} className="w-2.5 h-2.5" />
                  ) : (
                    <Compass style={{ color: themeColor }} className="w-2.5 h-2.5" />
                  )}
                  <span className="font-bold uppercase">{target.category}</span>
                </div>

                {/* Bottom Telemetry Card Ribbon (Label, Range, Threat, Scan State) */}
                <div
                  style={{
                    backgroundColor: 'rgba(2, 6, 23, 0.92)',
                    borderColor: `${themeColor}80`,
                  }}
                  className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded border flex items-center gap-2 text-[9px] font-mono whitespace-nowrap shadow-lg transition-opacity ${
                    isSelected ? 'opacity-100 ring-1 ring-cyan-400/40' : 'opacity-85 group-hover:opacity-100'
                  }`}
                >
                  <span className="font-semibold text-slate-300">{target.label}</span>
                  <span className="text-slate-600">|</span>
                  <span style={{ color: themeColor }} className="font-bold">
                    {target.distanceKm} KM
                  </span>

                  {/* Threat meter ticks or Scan Check */}
                  {target.type === 'hazard' ? (
                    <span
                      style={{ color: themeColor }}
                      className="font-mono text-[8px] font-bold"
                    >
                      [{target.threatLevel}]
                    </span>
                  ) : isScanned ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[8px]">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      ANALYZED
                    </span>
                  ) : (
                    <span className="text-cyan-400/80 font-mono text-[8px]">
                      UNSCANNED
                    </span>
                  )}
                </div>

                {/* Scanning Progress Bar if currently scanning */}
                {isScanning && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 bg-slate-950/95 border border-cyan-400 rounded p-1 text-[8px] font-mono text-center text-cyan-300 shadow-xl animate-pulse">
                    <div className="flex justify-between mb-0.5">
                      <span>RADAR SCAN</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                      <div
                        style={{ width: `${scanProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 3. Detailed Holographic Target Telemetry Card (when a target is locked) */}
          {selectedTarget && (
            <div
              style={{
                borderColor: selectedTarget.threatColor,
                boxShadow: `0 0 25px ${selectedTarget.threatColor}25`,
              }}
              className="absolute bottom-14 left-3 w-72 sm:w-80 bg-slate-950/95 backdrop-blur-md border rounded-xl p-3 text-xs font-mono text-slate-300 shadow-2xl pointer-events-auto z-40 animate-in fade-in slide-in-from-left-2 duration-150"
            >
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                <div className="flex items-center gap-1.5">
                  <Target style={{ color: selectedTarget.threatColor }} className="w-4 h-4 animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wider text-slate-100 uppercase">
                    TACTICAL LOCK: {selectedTarget.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTargetId(null)}
                  className="text-slate-500 hover:text-slate-200 p-0.5 rounded transition-colors"
                  title="Disengage Target Lock"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Target Name & Subtitle */}
              <div className="mb-2">
                <div style={{ color: selectedTarget.threatColor }} className="font-bold text-xs truncate">
                  {selectedTarget.label}
                </div>
                <div className="text-[10px] text-slate-400">{selectedTarget.sublabel}</div>
              </div>

              {/* Real-time Telemetry Grid */}
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-900/60 rounded-lg border border-slate-800/60 mb-2.5 text-[10px]">
                <div>
                  <span className="text-slate-500">RANGE:</span>{' '}
                  <strong style={{ color: selectedTarget.threatColor }}>
                    {selectedTarget.distanceKm} KM
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">RADIAL VEL:</span>{' '}
                  <strong className="text-cyan-300">
                    +{selectedTarget.relativeVelocity || 0.4} KM/S
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">THREAT:</span>{' '}
                  <strong style={{ color: selectedTarget.threatColor }}>
                    {selectedTarget.threatLevel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">SENSOR STATUS:</span>{' '}
                  <strong
                    className={
                      selectedTarget.scanned || scannedIds[selectedTarget.id]
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }
                  >
                    {selectedTarget.scanned || scannedIds[selectedTarget.id]
                      ? 'COMPLETE'
                      : 'PRELIMINARY'}
                  </strong>
                </div>
              </div>

              {/* Sensor Findings Breakdown */}
              <div className="space-y-1 text-[10px] mb-3 bg-black/40 p-2 rounded border border-slate-800/40">
                {selectedTarget.details ? (
                  <>
                    {selectedTarget.details.composition && (
                      <div>
                        <span className="text-slate-400">COMPOSITION:</span>{' '}
                        <span className="text-slate-200">{selectedTarget.details.composition}</span>
                      </div>
                    )}
                    {selectedTarget.details.hazardVector && (
                      <div>
                        <span className="text-amber-400/90 font-semibold">HAZARD VECTOR:</span>{' '}
                        <span className="text-slate-200">{selectedTarget.details.hazardVector}</span>
                      </div>
                    )}
                    {selectedTarget.details.energySignature && (
                      <div>
                        <span className="text-cyan-400/90 font-semibold">ENERGY SIGNATURE:</span>{' '}
                        <span className="text-slate-200">{selectedTarget.details.energySignature}</span>
                      </div>
                    )}
                    {selectedTarget.details.salvageValue && (
                      <div>
                        <span className="text-emerald-400/90 font-semibold">HARVEST VALUE:</span>{' '}
                        <span className="text-slate-200">{selectedTarget.details.salvageValue}</span>
                      </div>
                    )}
                    {selectedTarget.details.recommendedAction && (
                      <div className="pt-1 mt-1 border-t border-slate-800 text-cyan-300/90">
                        <strong>REC:</strong> {selectedTarget.details.recommendedAction}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-400 italic">
                    Execute directional radar scan to decrypt broadband physical telemetry.
                  </div>
                )}
              </div>

              {/* Tactical Actions Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startTargetScan(selectedTarget.id)}
                  disabled={scanningTargetId === selectedTarget.id}
                  className="flex-1 py-1 px-2 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Radio className="w-3 h-3" />
                  <span>
                    {selectedTarget.scanned || scannedIds[selectedTarget.id]
                      ? 'RE-SCAN TARGET'
                      : 'INITIATE SENSOR SCAN'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (rendererRef.current) rendererRef.current.triggerShake(3);
                    sound.playCommsChirp(900);
                  }}
                  className="py-1 px-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Align Deflector Field"
                >
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>ALIGN DEFLECTOR</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Proximity Hazard Emergency HUD Warning Banner */}
          {criticalHazard && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-rose-950/90 backdrop-blur-md border border-rose-500 rounded-lg text-rose-200 text-xs font-terminal flex items-center gap-2 shadow-2xl shadow-rose-950/80 animate-pulse z-30">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              <span className="font-bold tracking-wider uppercase text-[11px]">
                COLLISION TRAJECTORY WARNING // {criticalHazard.label} ({criticalHazard.distanceKm} KM)
              </span>
            </div>
          )}

          {/* 5. Active Sensor Ping Radar Sweep Telemetry Banner */}
          {activeSensorPing && (
            <div
              style={{
                borderColor: activeSensorPing.color,
                boxShadow: `0 0 24px ${activeSensorPing.color}35`,
              }}
              className="absolute top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-950/95 backdrop-blur-md border rounded-xl text-xs font-mono shadow-2xl z-35 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto"
            >
              <div
                style={{ borderColor: activeSensorPing.color }}
                className="relative w-8 h-8 rounded-lg bg-black/70 border flex items-center justify-center shrink-0"
              >
                <Radio
                  style={{ color: activeSensorPing.color }}
                  className="w-4 h-4 animate-spin-slow"
                />
                <span
                  style={{ backgroundColor: activeSensorPing.color }}
                  className="absolute inset-0 rounded-lg animate-ping opacity-35"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase">
                    ACTIVE SENSOR PING // RADAR SWEEP
                  </span>
                  <span
                    style={{ borderColor: activeSensorPing.color, color: activeSensorPing.color }}
                    className="text-[9px] px-1.5 py-0.2 rounded border bg-black/60 font-bold uppercase"
                  >
                    {activeSensorPing.dangerLevel} THREAT
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                  <span className="text-cyan-100 font-display tracking-wide">
                    {activeSensorPing.title.toUpperCase()}
                  </span>
                  <span className="text-slate-500 text-[10px]">|</span>
                  <span className="text-[10px] text-cyan-300">
                    {activeSensorPing.distance} KM · BRG{' '}
                    {String(activeSensorPing.bearingDeg).padStart(3, '0')}°
                  </span>
                </div>
              </div>

              {/* Sweeping animated radar telemetry indicator */}
              <div className="hidden sm:flex flex-col items-end pl-2 border-l border-slate-800 text-[9px] text-cyan-400/80">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SENSOR ACQUIRED
                </span>
                <span className="text-slate-500 font-mono">SWEEP COMPLETE</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Aerospace Telemetry Ribbon */}
      <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between text-xs font-terminal tracking-wider">
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400">
          <Compass className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" />
          <span className="font-semibold text-[11px]">{ship.sector.toUpperCase()}</span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">
            {SECTOR_VISUAL_PROFILES[Math.max(1, Math.min(4, ship.sectorLevel || 1))]?.themeTitle || 'DEEP VOID'}
          </span>
          <span
            className="w-2 h-2 rounded-full inline-block ml-0.5"
            style={{
              backgroundColor:
                SECTOR_VISUAL_PROFILES[Math.max(1, Math.min(4, ship.sectorLevel || 1))]?.dustColor || '#38bdf8',
            }}
            title={`Sector Level ${ship.sectorLevel}: ${SECTOR_VISUAL_PROFILES[Math.max(1, Math.min(4, ship.sectorLevel || 1))]?.starDensity} Star Density`}
          />
        </div>

        {/* Center Tactical HUD Filter & Targeting Mode Bar */}
        <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-lg border border-cyan-900/60 text-[10px] font-mono">
          <button
            onClick={() => setIsHudVisible((v) => !v)}
            className={`px-2 py-0.5 rounded transition-colors ${
              isHudVisible
                ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Tactical HUD Overlays"
          >
            HUD: {isHudVisible ? 'ON' : 'OFF'}
          </button>

          {isHudVisible && (
            <>
              <div className="h-3 w-px bg-slate-800 mx-0.5" />
              <button
                onClick={() => setHudFilter('all')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  hudFilter === 'all'
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALL ({tacticalTargets.length})
              </button>
              <button
                onClick={() => setHudFilter('hazards')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  hudFilter === 'hazards'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 font-bold'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                HAZARDS ({hazardCount})
              </button>
              <button
                onClick={() => setHudFilter('scans')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  hudFilter === 'scans'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                SCAN ({scanCount})
              </button>

              <div className="h-3 w-px bg-slate-800 mx-0.5" />
              <button
                onClick={cycleNextTarget}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[9px] flex items-center gap-1 transition-colors"
                title="Cycle Target Lock (Shortcut: TAB)"
              >
                <Target className="w-2.5 h-2.5 text-cyan-400" />
                <span>CYCLE [TAB]</span>
              </button>
            </>
          )}
        </div>

        {/* Right Metric Cluster: Distance & Throttle Velocity */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-slate-300 flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 uppercase">RANGE:</span>
            <span className="font-semibold text-cyan-300 font-mono tabular-nums text-xs">
              {ship.distance.toFixed(1)} LY
            </span>
          </div>

          <div
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-mono text-xs ${
              ship.speed === 0
                ? 'bg-slate-900/80 border-slate-700 text-slate-400'
                : ship.speed >= 4
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-900/50'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                ship.speed >= 4 ? 'animate-pulse text-rose-400' : 'text-cyan-400'
              }`}
            />
            <span className="font-bold">
              {ship.speed === 0
                ? 'IDLE'
                : ship.speed >= 4
                ? `WARP ${ship.speed}.0`
                : `SUB-LIGHT ${ship.speed}.0`}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Hull Damage Banner */}
      {ship.hull <= 30 && (
        <div className="relative z-10 mx-auto px-3.5 py-1.5 bg-rose-950/90 border border-rose-500/80 rounded-lg text-rose-200 text-xs font-terminal animate-bounce flex items-center gap-2 shadow-lg shadow-rose-900/40">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span className="font-bold tracking-wider text-[11px] uppercase">
            CRITICAL HULL DAMAGE — BREACH IMMINENT
          </span>
        </div>
      )}

      {/* Interactive Display Properties Bar & Camera HUD Overlay */}
      <div className="relative z-10 px-3 py-2 flex flex-col gap-2 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent">
        {/* Expanded Display Settings Drawer */}
        {isControlsOpen && (
          <div className="bg-slate-950/95 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-terminal shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* View Mode Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                CAMERA PERSPECTIVE
              </span>
              <div className="flex items-center gap-1">
                {(['chase', 'tactical', 'cinematic'] as CameraViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateDisplayProps({ viewMode: mode })}
                    className={`flex-1 px-2 py-1 text-[10px] uppercase font-mono rounded transition-colors ${
                      displayProps.viewMode === mode
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensor Spectrum Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                SENSOR SPECTRUM
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'optical', label: 'OPT' },
                    { id: 'thermal', label: 'THRM' },
                    { id: 'night', label: 'EM' },
                    { id: 'wireframe', label: 'WIRE' },
                  ] as Array<{ id: VisualSpectrum; label: string }>
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => updateDisplayProps({ spectrum: id })}
                    className={`flex-1 px-1.5 py-1 text-[10px] uppercase font-mono rounded transition-colors ${
                      displayProps.spectrum === id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Feature Toggles & Zoom */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                HUD ELEMENTS & ZOOM
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    updateDisplayProps({ showFlightVectors: !displayProps.showFlightVectors })
                  }
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                    displayProps.showFlightVectors
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle Forward Flight Vectors"
                >
                  VECTORS
                </button>

                <button
                  onClick={() =>
                    updateDisplayProps({ showNavGrid: !displayProps.showNavGrid })
                  }
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                    displayProps.showNavGrid
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle Tactical Space Grid"
                >
                  GRID
                </button>

                <button
                  onClick={() =>
                    updateDisplayProps({ dynamicBanking: !displayProps.dynamicBanking })
                  }
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                    displayProps.dynamicBanking
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle Dynamic Flight Banking & Roll"
                >
                  BANKING
                </button>

                {/* Zoom Stepper */}
                <div className="flex items-center ml-auto gap-1 bg-slate-900/90 border border-slate-800 rounded px-1 py-0.5">
                  <button
                    onClick={() => handleZoomChange(-0.15)}
                    className="p-1 text-slate-400 hover:text-cyan-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-mono text-cyan-300 px-1">
                    {displayProps.zoomLevel.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => handleZoomChange(0.15)}
                    className="p-1 text-slate-400 hover:text-cyan-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Cockpit Status & Quick Control Ribbon */}
        <div className="flex items-center justify-between text-[11px] font-terminal text-slate-400">
          <div className="flex items-center gap-3">
            {/* Propulsion Status */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  ship.speed > 0 ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 text-[10px] sm:text-[11px]">
                PROPULSION:{' '}
                <strong className="text-cyan-300 font-mono">
                  {ship.speed > 0 ? `${ship.speed * 20}% OUTPUT` : 'STANDBY'}
                </strong>
              </span>
            </div>

            {/* Shield Indicator */}
            {ship.shields > 0 ? (
              <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] sm:text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  DEFLECTOR:{' '}
                  <strong className="font-mono text-cyan-200">{ship.shields}%</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400 text-[10px] sm:text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                <span>SHIELDS OFFLINE</span>
              </div>
            )}
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center gap-2">
            {/* 2D Ship Schematics Wireframe Overlay Toggle */}
            <button
              onClick={handleToggleSchematics}
              className={`px-2.5 py-1 rounded border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                effectiveSchematicsOpen
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
              }`}
              title="Toggle Interactive 2D Ship Schematics Wireframe Overlay"
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>SCHEMATICS</span>
            </button>

            {/* Science Radar Scan Button */}
            <button
              onClick={handleTriggerScan}
              className="px-2.5 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-600/50 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Pulse Radar Sonar Scan"
            >
              <Radio className="w-3 h-3" />
              <span>RADAR SCAN</span>
            </button>

            {/* Display Properties Expand Toggle */}
            <button
              onClick={() => setIsControlsOpen((prev) => !prev)}
              className={`px-2.5 py-1 rounded border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                isControlsOpen
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
              }`}
              title="Display Properties & Sensor Settings"
            >
              <Sliders className="w-3 h-3" />
              <span className="hidden sm:inline">DISPLAY FX</span>
              {isControlsOpen ? (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 2D Ship Schematics Wireframe Overlay Modal */}
      {effectiveSchematicsOpen && (
        <div className="absolute inset-0 z-40 p-2 sm:p-4 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95">
          <ShipSchematics
            ship={ship}
            crew={crew}
            encounter={encounter}
            mode="overlay"
            onClose={() => {
              if (onToggleSchematics) onToggleSchematics();
              else setLocalSchematicsOpen(false);
            }}
            onSendCommand={onSendCommand}
          />
        </div>
      )}
    </div>
  );
};
