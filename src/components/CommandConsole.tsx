import React, { useState } from 'react';
import { Send, Settings, Loader2, Sparkles, Shield, Wrench, Zap, Compass, RefreshCw } from 'lucide-react';

interface CommandConsoleProps {
  onSendCommand: (command: string) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  onSendCommand,
  isLoading,
  onOpenSettings,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendCommand(input.trim());
    setInput('');
  };

  const handleQuickDirective = (orderText: string) => {
    if (isLoading) return;
    onSendCommand(orderText);
  };

  return (
    <div
      id="command-console-panel"
      className="flex flex-col h-full bg-[#080c16] border border-cyan-900/40 rounded-xl p-3.5 shadow-xl font-sans"
    >
      {/* Console Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-100">
            Captain Command Console
          </h3>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px] font-terminal transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-cyan-400" />
          <span>SYS CONFIG</span>
        </button>
      </div>

      {/* Quick Tactical Directives */}
      <div className="space-y-1.5 mb-2.5">
        <span className="text-[10px] font-terminal text-slate-400 uppercase tracking-wider block">
          QUICK TACTICAL ORDERS:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Elara, divert auxiliary power to deflector shields!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-cyan-950/50 border border-cyan-800/40 hover:border-cyan-500 text-left text-[11px] text-cyan-200 transition-colors disabled:opacity-50"
          >
            <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">Boost Shields</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Jax, deploy repair nanites to patch the hull!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-amber-950/50 border border-amber-800/40 hover:border-amber-500 text-left text-[11px] text-amber-200 transition-colors disabled:opacity-50"
          >
            <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Repair Hull</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Elara, run a deep spectrum scan on that hazard!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-indigo-950/50 border border-indigo-800/40 hover:border-indigo-500 text-left text-[11px] text-indigo-200 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">Scan Anomaly</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Jax, fire full throttle! Max engine burn to Speed 5!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-rose-950/50 border border-rose-800/40 hover:border-rose-500 text-left text-[11px] text-rose-200 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">Max Burn (Spd 5)</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Jax, cut engines and hold position in drift!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-left text-[11px] text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Cut Engines (Stop)</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Crew, hard evasive roll! Dodge incoming debris!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-teal-950/50 border border-teal-800/40 hover:border-teal-500 text-left text-[11px] text-teal-200 transition-colors disabled:opacity-50"
          >
            <Compass className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="truncate">Evasive Maneuver</span>
          </button>
        </div>
      </div>

      {/* Natural Language Command Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-end space-y-2">
        <div className="relative">
          <div className="absolute top-2.5 left-3 text-xs font-terminal text-cyan-400/80 pointer-events-none">
            CAPT &gt;
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type any order to Jax & Elara (e.g. 'Jax, divert power to shields')..."
            className="w-full bg-slate-950 border border-cyan-900/60 focus:border-cyan-400 rounded-lg pl-14 pr-24 py-2.5 text-xs font-terminal text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-terminal text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-cyan-900/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">RELAYING</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>ORDER</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-terminal text-slate-500 px-1">
          <span>AI AGENTS AUTONOMOUSLY EXECUTE &amp; BANTER</span>
          <span>ENTER TO TRANSMIT</span>
        </div>
      </form>
    </div>
  );
};
