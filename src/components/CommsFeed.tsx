import React, { useEffect, useRef } from 'react';
import { CommsMessage } from '../types';
import { MessageSquare, Wrench, Sparkles, Terminal, UserCheck, Volume2, VolumeX, Trash2 } from 'lucide-react';

interface CommsFeedProps {
  messages: CommsMessage[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearMessages: () => void;
}

export const CommsFeed: React.FC<CommsFeedProps> = ({
  messages,
  soundEnabled,
  onToggleSound,
  onClearMessages,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getSpeakerStyle = (speaker: string) => {
    switch (speaker) {
      case 'Jax':
        return {
          badge: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
          bubble: 'bg-amber-950/20 border-amber-900/40 text-slate-200',
          name: 'text-amber-400',
          icon: <Wrench className="w-3.5 h-3.5 text-amber-400" />,
          role: 'CHIEF ENGINEER',
        };
      case 'Elara':
        return {
          badge: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300',
          bubble: 'bg-cyan-950/20 border-cyan-900/40 text-slate-200',
          name: 'text-cyan-400',
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
          role: 'SCIENCE OFFICER',
        };
      case 'Captain':
        return {
          badge: 'bg-sky-950/90 border-sky-400/80 text-sky-200',
          bubble: 'bg-sky-950/30 border-sky-900/50 text-sky-100',
          name: 'text-sky-300',
          icon: <UserCheck className="w-3.5 h-3.5 text-sky-300" />,
          role: 'CAPTAIN ON DECK',
        };
      default:
        return {
          badge: 'bg-slate-900/80 border-slate-700 text-slate-300',
          bubble: 'bg-slate-950/40 border-slate-800 text-slate-300',
          name: 'text-slate-400',
          icon: <Terminal className="w-3.5 h-3.5 text-slate-400" />,
          role: 'SHIP COMPUTER',
        };
    }
  };

  return (
    <div
      id="comms-feed-panel"
      className="flex flex-col h-full bg-[#080b14] border border-cyan-900/40 rounded-xl p-3.5 shadow-xl font-sans"
    >
      {/* Comms Bar Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-100">
            Tactical Bridge Comms Feed
          </h3>
          <span className="text-[10px] font-terminal text-cyan-400/70 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            FREQ: 1420.40 MHz // SECURE
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Bridge Audio' : 'Unmute Bridge Audio'}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClearMessages}
            title="Clear Feed Log"
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrolling Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-terminal text-slate-500 italic">
            Bridge comms channel open. Issue captain orders below.
          </div>
        ) : (
          messages.map((msg) => {
            const style = getSpeakerStyle(msg.speaker);
            const isCaptain = msg.speaker === 'Captain';

            return (
              <div
                key={msg.id}
                className={`p-2.5 rounded-lg border text-xs transition-all ${style.bubble} ${
                  isCaptain ? 'ml-4 bg-sky-950/20 border-sky-800/40' : 'mr-2'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-terminal font-semibold flex items-center gap-1 ${style.badge}`}>
                      {style.icon}
                      {msg.speaker.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-terminal hidden sm:inline">
                      [{style.role}]
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-terminal">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans text-xs pl-0.5">
                  {msg.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
