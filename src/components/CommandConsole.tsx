import React, { useState, useEffect } from 'react';
import {
  Send,
  Settings,
  Loader2,
  Sparkles,
  Shield,
  Wrench,
  Zap,
  Compass,
  RefreshCw,
  Mic,
  MicOff,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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
  const [dismissError, setDismissError] = useState(false);

  // Web Speech API hook for vocal commands
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    handsFree,
    setHandsFree,
    toggleListening,
    stopListening,
  } = useSpeechRecognition({
    onSendCommand: (vocalCommand) => {
      // Show what was spoken and transmit automatically
      setInput(vocalCommand);
      onSendCommand(vocalCommand);
    },
    isLoading,
  });

  // Reset error dismiss if a new error comes up
  useEffect(() => {
    if (error) {
      setDismissError(false);
    }
  }, [error]);

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
      <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 animate-ping'}`} />
          <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-100">
            Captain Command Console
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Web Speech API Microphone Activation Button */}
          {isSupported ? (
            <>
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Mute Captain Microphone' : 'Activate Voice Command Microphone (Web Speech API)'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-terminal transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md shadow-rose-950 animate-pulse'
                    : 'bg-cyan-950/50 hover:bg-cyan-900/70 border-cyan-700/60 text-cyan-300'
                }`}
              >
                <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-rose-400' : 'text-cyan-400'}`} />
                <span>{isListening ? 'MIC ACTIVE' : 'VOICE MIC'}</span>
              </button>

              <button
                type="button"
                onClick={() => setHandsFree(!handsFree)}
                title="Toggle Hands-Free Continuous Voice Orders"
                className={`px-2 py-1 rounded-lg border text-[10px] font-terminal transition-colors cursor-pointer hidden sm:flex items-center gap-1 ${
                  handsFree
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>HANDS-FREE:</span>
                <strong className={handsFree ? 'text-emerald-400' : 'text-slate-500'}>
                  {handsFree ? 'ON' : 'OFF'}
                </strong>
              </button>
            </>
          ) : (
            <div
              title="Web Speech API is not supported in this browser. Please use Chrome or Edge."
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-500 text-[10px] font-terminal"
            >
              <MicOff className="w-3 h-3 text-slate-600" />
              <span className="hidden sm:inline">NO SPEECH API</span>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px] font-terminal transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CONFIG</span>
          </button>
        </div>
      </div>

      {/* Quick Tactical Directives */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-terminal text-slate-400 uppercase tracking-wider block">
            QUICK ORDERS & AGENT INQUIRIES:
          </span>
          <span className="text-[10px] font-terminal text-cyan-400/80">
            LLM ROUTED AGENTS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Jax, reduce throttle')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-amber-950/50 border border-amber-800/40 hover:border-amber-500 text-left text-[11px] text-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Jax: Reduce Throttle</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Elara, hows your stress?')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-cyan-950/50 border border-cyan-800/40 hover:border-cyan-500 text-left text-[11px] text-cyan-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">Elara: How's Stress?</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Elara, divert auxiliary power to deflector shields!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-cyan-950/50 border border-cyan-800/40 hover:border-cyan-500 text-left text-[11px] text-cyan-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">Elara: Boost Shields</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Jax, deploy repair nanites to patch the hull!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-amber-950/50 border border-amber-800/40 hover:border-amber-500 text-left text-[11px] text-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Jax: Repair Hull</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Elara, run a deep spectrum scan on that hazard!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-indigo-950/50 border border-indigo-800/40 hover:border-indigo-500 text-left text-[11px] text-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">Elara: Scan Anomaly</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Jax, cut engines and hold position in drift!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-left text-[11px] text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Jax: Cut Engines (Stop)</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Jax, how are the engines holding up?')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-amber-950/50 border border-amber-800/40 hover:border-amber-500 text-left text-[11px] text-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Jax: Engine Status?</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDirective('Crew, hard evasive roll! Dodge incoming debris!')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-950/70 hover:bg-teal-950/50 border border-teal-800/40 hover:border-teal-500 text-left text-[11px] text-teal-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Compass className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="truncate">Crew: Evasive Roll</span>
          </button>
        </div>
      </div>

      {/* Live Voice Comms Feedback Banner */}
      {isListening && (
        <div className="mb-2 bg-gradient-to-r from-cyan-950/70 via-slate-900/80 to-cyan-950/70 border border-cyan-500/50 rounded-lg p-2 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center gap-0.5 h-4 px-1 shrink-0">
              <div className="w-1 bg-cyan-400 rounded-full animate-wave-a" />
              <div className="w-1 bg-cyan-300 rounded-full animate-wave-b" />
              <div className="w-1 bg-cyan-400 rounded-full animate-wave-c" />
              <div className="w-1 bg-cyan-300 rounded-full animate-wave-a" />
            </div>

            <div className="min-w-0 text-left">
              <div className="text-[10px] font-terminal font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>CAPTAIN AUDIO FEED LIVE {handsFree ? '[HANDS-FREE]' : ''}</span>
              </div>
              <div className="text-xs text-slate-100 font-terminal truncate">
                {interimTranscript ? (
                  <span className="text-cyan-200 italic font-medium">"{interimTranscript}..."</span>
                ) : transcript ? (
                  <span className="text-emerald-300 font-medium">Auto-Transmitting: "{transcript}"</span>
                ) : (
                  <span className="text-slate-400">Speak order to crew (e.g. "Jax, full speed ahead!")...</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={stopListening}
            className="px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-terminal shrink-0 cursor-pointer"
          >
            MUTE MIC
          </button>
        </div>
      )}

      {/* Error alert notice */}
      {error && !dismissError && (
        <div className="mb-2 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-amber-950/60 border border-amber-700/60 text-amber-200 text-[11px] font-terminal">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissError(true)}
            className="text-[10px] text-amber-300 hover:text-white shrink-0 uppercase underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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
            placeholder={
              isListening
                ? '🎙️ Listening to Captain voice... Speak command now'
                : "Type or click MIC to speak orders (e.g. 'Jax, divert power to shields')..."
            }
            className={`w-full bg-slate-950 border rounded-lg pl-14 pr-32 py-2.5 text-xs font-terminal text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-inner ${
              isListening
                ? 'border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'border-cyan-900/60 focus:border-cyan-400'
            }`}
          />

          <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1.5">
            {/* Quick Mic button inside input */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={isLoading}
                title={isListening ? 'Mute Microphone' : 'Speak Order into Browser Microphone'}
                className={`h-full px-2.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-900/50'
                    : 'bg-slate-900 hover:bg-cyan-950/80 text-cyan-400 hover:text-cyan-300 border border-cyan-800/40'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-full px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-terminal text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-cyan-900/30 cursor-pointer"
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
        </div>

        <div className="flex items-center justify-between text-[10px] font-terminal text-slate-500 px-1">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400/70" />
            <span>VOICE COMMANDS SUPPORTED (WEB SPEECH API)</span>
          </span>
          <span>SPEAK OR HIT ENTER TO DISPATCH</span>
        </div>
      </form>
    </div>
  );
};

