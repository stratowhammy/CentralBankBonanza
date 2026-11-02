import React from 'react';
import { MPCVotingResult } from '../../types';

interface MpcVotingDivisionModalProps {
  votingResult?: MPCVotingResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MpcVotingDivisionModal: React.FC<MpcVotingDivisionModalProps> = ({
  votingResult,
  isOpen,
  onClose
}) => {
  if (!isOpen || !votingResult) return null;

  const getVoteBadge = (vote: string) => {
    if (vote === 'AYE') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          ✓ AYE (Concur)
        </span>
      );
    }
    if (vote === 'DISSENT_HAWK') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          ▲ DISSENT (Favor Hike)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
        ▼ DISSENT (Favor Cut)
      </span>
    );
  };

  const getRoleColor = (role: string) => {
    if (role === 'Hawk') return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    if (role === 'Dove') return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    if (role === 'Chair') return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xl font-mono">
              ⚖
            </span>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Monetary Policy Committee (MPC) Voting Record
              </h2>
              <p className="text-xs text-slate-400">
                Official Board Division & Dissenting Statements for Month 3 Policy Review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 text-sm rounded-lg hover:bg-slate-800"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tally Card */}
          <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Decision Status</div>
              <div className="text-2xl font-serif font-bold text-white mt-0.5">
                {votingResult.passed ? 'Policy Rate Resolution Enacted' : 'Resolution Blocked by Committee'}
              </div>
              <div className="text-sm text-slate-300 mt-1">
                {votingResult.consensus_summary}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-center">
                <div className="text-xs text-emerald-400 uppercase font-semibold">Ayes</div>
                <div className="text-2xl font-mono font-bold text-emerald-300">{votingResult.ayes}</div>
              </div>
              <div className="px-4 py-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-center">
                <div className="text-xs text-rose-400 uppercase font-semibold">Dissents</div>
                <div className="text-2xl font-mono font-bold text-rose-300">{votingResult.dissents}</div>
              </div>
            </div>
          </div>

          {/* Member Voting Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Member Voting Rationales & Benchmark Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {votingResult.member_votes.map((mv) => (
                <div
                  key={mv.member_id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">{mv.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${getRoleColor(mv.role)}`}>
                          {mv.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Preferred Rate: <strong className="text-slate-200">{mv.preferred_rate.toFixed(2)}%</strong> ({mv.preferred_delta_bps >= 0 ? '+' : ''}{mv.preferred_delta_bps} bps)
                      </div>
                    </div>
                    {getVoteBadge(mv.vote)}
                  </div>

                  <p className="text-xs text-slate-300 italic border-l-2 border-slate-700 pl-2.5 py-0.5">
                    "{mv.rationale}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <div className="text-xs text-slate-400">
            Dissenting statements are published in the official Central Bank Gazette and reported by the financial press.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30"
          >
            Acknowledge Committee Record
          </button>
        </div>
      </div>
    </div>
  );
};
