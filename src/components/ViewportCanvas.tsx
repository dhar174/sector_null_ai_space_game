import React, { useEffect, useRef } from 'react';
import { ShipState, Encounter } from '../types';
import { SpaceRenderer } from '../game/starfield';
import { AlertTriangle, Compass, ShieldAlert, Zap } from 'lucide-react';

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new SpaceRenderer(canvas);
    rendererRef.current = renderer;
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

  return (
    <div
      id="viewport-container"
      ref={containerRef}
      className="relative w-full h-full min-h-[300px] bg-[#070a12] border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* CRT Scanline and Screen Corner Gradients */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-950/[0.03] to-cyan-950/[0.15]" />
      <div className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-40" />

      {/* Top Bar HUD Info */}
      <div className="relative z-10 p-3.5 flex items-center justify-between text-xs font-terminal tracking-wider">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400">
          <Compass className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" />
          <span>SYS.TACTICAL // {ship.sector.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase">LOG DISTANCE:</span>
            <span className="font-semibold text-cyan-300 font-mono">{ship.distance.toFixed(1)} LY</span>
          </div>

          <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
            ship.speed === 0
              ? 'bg-slate-900/80 border-slate-700 text-slate-400'
              : ship.speed >= 4
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
              : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span className="font-bold">VELOCITY {ship.speed}.0</span>
          </div>
        </div>
      </div>

      {/* Center Critical Alert Warning (if hull critical) */}
      {ship.hull <= 30 && (
        <div className="relative z-10 mx-auto px-4 py-2 bg-rose-950/90 border border-rose-500/80 rounded-lg text-rose-200 text-xs font-terminal animate-bounce flex items-center gap-2 shadow-lg shadow-rose-900/40">
          <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          <span className="font-bold tracking-widest uppercase">CRITICAL HULL DAMAGE — ORDER IMMEDIATE REPAIR</span>
        </div>
      )}

      {/* Bottom Status Ticker Overlay */}
      <div className="relative z-10 p-3 flex items-center justify-between text-[11px] font-terminal text-slate-400 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">MAIN THRUSTER: {ship.speed > 0 ? 'ONLINE' : 'IDLE'}</span>
          </div>
          {ship.shields > 0 && (
            <div className="flex items-center gap-1.5 text-cyan-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DEFLECTOR ACTIVE ({ship.shields}%)</span>
            </div>
          )}
        </div>

        <div className="text-slate-400 hidden sm:block">
          CAMERA: TOP-DOWN RADIAL LOCK
        </div>
      </div>
    </div>
  );
};
