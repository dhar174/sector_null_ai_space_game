import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShipState, Encounter, DisplayProperties, CameraViewMode, VisualSpectrum } from '../types';
import { SpaceRenderer } from '../game/starfield';
import {
  Compass,
  Zap,
  ShieldAlert,
  Radio,
  Eye,
  Crosshair,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Sparkles,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ViewportCanvasProps {
  ship: ShipState;
  encounter: Encounter | null;
  onRendererReady?: (renderer: SpaceRenderer) => void;
  rendererRef: React.MutableRefObject<SpaceRenderer | null>;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  ship,
  encounter,
  onRendererReady,
  rendererRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sync state into renderer
  const updateDisplayProps = useCallback((updates: Partial<DisplayProperties>) => {
    setDisplayProps((prev) => {
      const next = { ...prev, ...updates };
      if (rendererRef.current) {
        rendererRef.current.setDisplayProperties(next);
      }
      return next;
    });
  }, [rendererRef]);

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
    const loop = (now: number) => {
      renderer.render(ship, encounter, now);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  // Pointer move handler for responsive interactive steering & flight dynamics
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !rendererRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize from -1 to +1 relative to center
    const normX = ((x / rect.width) - 0.5) * 2;
    const normY = ((y / rect.height) - 0.72) * 2;

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

  const handleTriggerScan = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rendererRef.current) {
      rendererRef.current.triggerScan();
    }
  };

  const handleZoomChange = (delta: number) => {
    const newZoom = Math.max(0.75, Math.min(1.5, Math.round((displayProps.zoomLevel + delta) * 100) / 100));
    updateDisplayProps({ zoomLevel: newZoom });
  };

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

      {/* Top Aerospace Telemetry Ribbon */}
      <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between text-xs font-terminal tracking-wider">
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400">
          <Compass className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" />
          <span className="font-semibold text-[11px]">{ship.sector.toUpperCase()}</span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">GRID 42-ALPHA</span>
        </div>

        {/* Center Proximity Alert Indicator (if hazard active) */}
        {encounter && encounter.active && (
          <div className="hidden md:flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-amber-500/40 text-amber-300 animate-pulse">
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] uppercase font-mono tracking-widest font-semibold">
              TARGET LOCK: {encounter.title} ({Math.round(encounter.distanceRemaining)} KM)
            </span>
          </div>
        )}

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
    </div>
  );
};
