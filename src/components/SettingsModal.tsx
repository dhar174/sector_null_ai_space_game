import React, { useState } from 'react';
import { SettingsState } from '../types';
import { X, Key, Cpu, Volume2, ShieldCheck, CheckCircle2, RefreshCw, Mic } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  onSaveSettings: (newSettings: SettingsState) => void;
  onRestartGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onRestartGame,
}) => {
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'simulation'>(settings.provider);
  const [geminiKey, setGeminiKey] = useState(settings.customGeminiKey || '');
  const [openAiKey, setOpenAiKey] = useState(settings.customOpenAiKey || '');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      provider,
      customGeminiKey: geminiKey.trim(),
      customOpenAiKey: openAiKey.trim(),
      soundEnabled,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#090e1b] border border-cyan-500/40 rounded-xl p-5 shadow-2xl shadow-cyan-950/50 space-y-4 font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-display uppercase tracking-wide text-white">
              Bridge Systems &amp; LLM Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-xs font-terminal text-slate-300 block uppercase">
            AI Engine Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                provider === 'gemini'
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold font-display text-sm">Gemini Flash</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Built-in or Custom Key</div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                provider === 'openai'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold font-display text-sm">OpenAI</div>
              <div className="text-[10px] text-slate-400 mt-0.5">GPT-4o-mini Key</div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('simulation')}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                provider === 'simulation'
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-md shadow-amber-950'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold font-display text-sm">Simulation</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Offline / Instant Mode</div>
            </button>
          </div>
        </div>

        {/* API Key Inputs */}
        {provider === 'gemini' && (
          <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-terminal text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Custom Gemini API Key (Optional)
              </label>
              <span className="text-[10px] text-cyan-400/80 font-terminal">
                [Built-in key is active if blank]
              </span>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Leave blank to use workspace server GEMINI_API_KEY..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-xs font-terminal text-slate-100 placeholder:text-slate-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              The game already connects to the pre-configured Gemini 3.8 Flash model on the server. You can optionally paste a custom key to override.
            </p>
          </div>
        )}

        {provider === 'openai' && (
          <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <label className="text-xs font-terminal text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              OpenAI API Key
            </label>
            <input
              type="password"
              value={openAiKey}
              onChange={(e) => setOpenAiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded px-3 py-2 text-xs font-terminal text-slate-100 placeholder:text-slate-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Calls GPT-4o-mini for structured dialogue and game state JSON actions. Key stays in session memory.
            </p>
          </div>
        )}

        {provider === 'simulation' && (
          <div className="bg-amber-950/30 border border-amber-900/50 p-3 rounded-lg text-xs text-amber-200/90 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-300">
              <ShieldCheck className="w-4 h-4" />
              Autonomous Offline Crew Simulator
            </div>
            Simulates Jax and Elara's reactions locally with 0ms latency. No network or API credentials required.
          </div>
        )}

        {/* Audio Toggle */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">Bridge Audio &amp; SFX</div>
              <div className="text-[11px] text-slate-400">Tactical sound effects, comms beeps, reactor alarms</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              soundEnabled ? 'bg-cyan-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Web Speech Voice Control Status */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">Web Speech Voice Recognition</div>
              <div className="text-[11px] text-slate-400">Speak commands directly into microphone to order Jax &amp; Elara</div>
            </div>
          </div>
          <span className="text-[10px] font-terminal px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-bold">
            SUPPORTED
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-cyan-900/40">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reboot starship systems and restart flight log?')) {
                onRestartGame();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/60 text-rose-300 text-xs font-terminal transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESTART GAME</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-terminal transition-colors"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-terminal text-xs font-bold transition-all shadow-md shadow-cyan-950"
            >
              {savedNotice ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>SAVED</span>
                </>
              ) : (
                <span>APPLY CONFIG</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
