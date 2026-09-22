import React from 'react';
import { ShipState } from '../types';
import { Skull, RefreshCw, Trophy, ShieldAlert } from 'lucide-react';

interface GameOverModalProps {
  ship: ShipState;
  onRestart: () => void;
  ordersCount: number;
  encountersCount: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  ship,
  onRestart,
  ordersCount,
  encountersCount,
}) => {
  if (!ship.isGameOver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a060d] border border-rose-500/60 rounded-xl p-6 text-center shadow-2xl shadow-rose-950/80 space-y-5 font-sans">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-400 animate-pulse shadow-lg shadow-rose-900/50">
          <Skull className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display uppercase tracking-widest text-rose-400">
            VESSEL DESTROYED
          </h2>
          <p className="text-xs font-terminal text-slate-400 uppercase">
            HULL INTEGRITY COLLAPSED AT 0% // FLIGHT RECORDER TERMINATED
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-left space-y-2 text-xs font-terminal">
          <div className="text-slate-400 text-[11px] pb-1 border-b border-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            FINAL LOG ENTRY: {ship.gameOverReason || 'Structural failure in Sector Null'}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block">TOTAL DISTANCE:</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                {ship.distance.toFixed(1)} LY
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">SECTOR LEVEL:</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {ship.sectorLevel}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">ORDERS TRANSMITTED:</span>
              <span className="text-sm font-bold text-indigo-400 font-mono">
                {ordersCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">ENCOUNTERS NAVIGATED:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {encountersCount}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic">
          "Jax: 'I told you that manifold couldn\'t take it, Captain...'"
        </p>

        <button
          onClick={onRestart}
          className="w-full py-3 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-terminal font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          <span>REBOOT STARSHIP &amp; RETRY MISSION</span>
        </button>
      </div>
    </div>
  );
};
