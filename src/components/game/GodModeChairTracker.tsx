import React, { useState } from 'react';
import { GameSession } from '../../types';
import { Crown, UserPlus, History, Award, CheckCircle2 } from 'lucide-react';

interface GodModeChairTrackerProps {
  session: GameSession;
  onSwitchChair: (nextChairId: string) => Promise<void>;
}

export const GodModeChairTracker: React.FC<GodModeChairTrackerProps> = ({ session, onSwitchChair }) => {
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (session.play_mode !== 'god_mode') return null;

  const activeChair = session.chair_state.active_chair;
  const history = session.chair_state.chair_history || [];
  const reactionMultiplier = (1.0 - 0.50 * (activeChair.starting_trust / 100)).toFixed(2);

  const availableChairs = [
    { id: 'chair_arthur_finch', name: 'Arthur Finch', title: 'The Pragmatic Technocrat', desc: 'Balanced, data-dependent, builds steady trust.' },
    { id: 'chair_evelyn_cross', name: 'Evelyn Cross', title: 'The Inflation Hawk', desc: 'Aggressive against price spirals, Wall Street fears her.' },
    { id: 'chair_marcus_sterling', name: 'Marcus Sterling', title: 'The Wall Street Whisperer', desc: 'Protects equity valuations and bank balance sheets.' },
    { id: 'chair_olivia_vance', name: 'Olivia Vance', title: 'The Labor & Welfare Champion', desc: 'Prioritizes maximum employment and wage growth.' }
  ];

  const handleSelectNext = async (id: string) => {
    setSwitching(true);
    try {
      await onSwitchChair(id);
      setShowSwitchModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to switch chair');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Left: Active Chair details */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xl shadow-md">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-prestige font-bold text-base text-slate-100">
                Chair {activeChair.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeChair.title}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tenure: <strong className="text-slate-200">{activeChair.tenure_months} months</strong> • Accumulated Trust: <strong className="text-indigo-300 font-mono">{activeChair.starting_trust.toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        {/* Right: Trust Multiplier & Succession Button */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Reaction Dampener</span>
            <span className="text-xs font-bold font-mono text-indigo-400">
              {reactionMultiplier}x Sensitivity
            </span>
          </div>

          <button
            onClick={() => setShowSwitchModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Succession Desk</span>
          </button>
        </div>

      </div>

      {/* Succession Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-prestige font-bold text-lg text-slate-100 mb-1">
              Central Bank Chair Succession Desk
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">
              In God Mode, you can retire the active governor and appoint a new central bank chair. The incoming chair will inherit the current economic state, but their initial trust will start fresh based on their archetype.
            </p>

            <div className="space-y-2.5 mb-6">
              {availableChairs.map((c) => {
                const isCurrent = c.name === activeChair.name;
                return (
                  <div
                    key={c.id}
                    onClick={() => !isCurrent && handleSelectNext(c.id)}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-slate-950/40 border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-slate-950 hover:bg-indigo-950/20 border-slate-800 hover:border-indigo-500/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-200">{c.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                        {isCurrent ? 'Current Chair' : c.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{c.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
