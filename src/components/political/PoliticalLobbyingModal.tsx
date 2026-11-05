import React, { useState } from 'react';
import { PoliticalSession, LobbyingContract } from '../../types';
import { api } from '../../api';
import { 
  Briefcase, DollarSign, ShieldAlert, Award, X, CheckCircle2, 
  AlertTriangle, ArrowRight, Building2, Flame, Sparkles, Scale, FileText
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: PoliticalSession;
  onRefreshSession: () => void;
}

export const PoliticalLobbyingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  session,
  onRefreshSession
}) => {
  const [isResponding, setIsResponding] = useState<string | null>(null);

  if (!isOpen) return null;

  const contracts = session.lobbying_contracts || [];
  const pendingContracts = contracts.filter(c => c.status === 'pending');
  const acceptedContracts = contracts.filter(c => c.status === 'accepted');
  const fulfilledContracts = contracts.filter(c => c.status === 'fulfilled');

  const handleAction = async (contractId: string, action: 'accept' | 'reject') => {
    setIsResponding(contractId);
    try {
      const res = await api.respondToLobbyingOffer(session.id, contractId, action);
      alert(res.message);
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve lobbying offer');
    } finally {
      setIsResponding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100 font-serif">
                K-Street Trade Group Deputations & Lobbying Pavilion
              </h2>
              <p className="text-xs text-amber-400/90 font-mono">
                Corporate & Trade Associations Offering Campaign Cash in Exchange for Statutory Favors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-xs text-stone-300 flex items-start space-x-3">
            <Scale className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-stone-100 mb-0.5">The Special-Interest Trade-Off</p>
              <p className="text-stone-400 leading-relaxed">
                Trade associations and corporate political action committees command vast campaign war chests. Accepting their legislative favors delivers immediate campaign checks and lucrative post-enactment bounties, but attracts investigative ethics scrutiny and voter skepticism. Rejecting their overtures cleanses your ethics record and elevates civic trust.
              </p>
            </div>
          </div>

          {/* Active Pending Deputations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-mono">
                Active Trade Group Petitions ({pendingContracts.length})
              </h3>
              <span className="text-xs text-stone-500 font-mono">
                Review Favor Terms & Campaign Cash Offers
              </span>
            </div>

            {pendingContracts.length === 0 ? (
              <div className="p-8 text-center text-stone-500 border border-stone-800/80 rounded-2xl bg-stone-950/40">
                No new trade group deputations are currently pending in your antechamber. Advance legislative months or draft new statutes to invite fresh industry overtures.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingContracts.map(contract => (
                  <div
                    key={contract.id}
                    className="p-5 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/40 transition-all space-y-4 shadow-lg"
                  >
                    {/* Trade Group & Chief Lobbyist Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-850 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-base text-stone-100 font-serif">{contract.trade_group}</span>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                            contract.ethics_risk_level === 'low'
                              ? 'bg-emerald-950/70 border-emerald-800/40 text-emerald-400'
                              : contract.ethics_risk_level === 'medium'
                              ? 'bg-amber-950/70 border-amber-800/40 text-amber-300'
                              : contract.ethics_risk_level === 'high'
                              ? 'bg-orange-950/70 border-orange-800/40 text-orange-300'
                              : 'bg-rose-950/70 border-rose-800/40 text-rose-400'
                          }`}>
                            {contract.ethics_risk_level} ethics risk
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Sector: <span className="text-stone-300 font-medium">{contract.sector}</span> • Chief Lobbyist: <span className="text-amber-200">{contract.chief_lobbyist}</span>
                        </p>
                      </div>

                      {/* Financial Payoff Pills */}
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-bold">
                          +${contract.campaign_contribution_millions}M Upfront
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-700/40 text-amber-300 text-xs font-mono font-bold">
                          +${contract.completion_bounty_millions}M on Passage
                        </div>
                      </div>
                    </div>

                    {/* What they want & Model Bill details */}
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block mb-1">
                          REQUESTED STATUTORY FAVOR:
                        </span>
                        <div className="font-bold text-sm text-stone-200 font-serif mb-1">
                          "{contract.favor_title}"
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/60 p-3.5 rounded-xl border border-stone-850">
                          {contract.favor_description}
                        </p>
                      </div>

                      {contract.suggested_bill_title && (
                        <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-850 flex items-start space-x-2.5 text-xs">
                          <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase font-mono text-stone-400 font-bold block">
                              Draft Model Statute (Introduced on Acceptance):
                            </span>
                            <span className="font-semibold text-stone-200">{contract.suggested_bill_title}</span>
                            <span className="text-stone-400 text-[11px] block mt-0.5">{contract.suggested_bill_summary}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Categorical & Colored Indicators (NO numbers!) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-mono text-stone-500 mr-1">Projected Political Ripple:</span>
                      {contract.indicators?.map((ind, i) => {
                        const isFav = ind.direction === 'favorable';
                        const isUnfav = ind.direction === 'unfavorable';
                        const isAlert = ind.direction === 'alert';
                        return (
                          <span
                            key={i}
                            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-sans font-medium flex items-center space-x-1 ${
                              isFav 
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                                : isUnfav 
                                ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
                                : isAlert 
                                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' 
                                : 'bg-stone-900 border-stone-800 text-stone-400'
                            }`}
                          >
                            <span>{ind.category}</span>
                            <span className="font-bold">{isFav ? '▲' : isUnfav ? '▼' : isAlert ? '⚡' : '▬'}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Decision Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-stone-850">
                      <button
                        onClick={() => handleAction(contract.id, 'reject')}
                        disabled={isResponding === contract.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-stone-100 text-xs font-bold transition-all"
                      >
                        🛡️ Reject & Denounce Influence
                      </button>

                      <button
                        onClick={() => handleAction(contract.id, 'accept')}
                        disabled={isResponding === contract.id}
                        className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-stone-950 text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept +${contract.campaign_contribution_millions}M & Queue Statute</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Accepted & Fulfilled Compactions */}
          {(acceptedContracts.length > 0 || fulfilledContracts.length > 0) && (
            <div className="pt-4 border-t border-stone-800 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
                Committed Lobbying Compacts ({acceptedContracts.length + fulfilledContracts.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {acceptedContracts.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-stone-950 border border-amber-600/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-200">{c.trade_group}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold">
                        Pending Enactment
                      </span>
                    </div>
                    <p className="text-stone-400 text-[11px]">"{c.suggested_bill_title || c.favor_title}"</p>
                    <div className="text-[10px] font-mono text-emerald-400 pt-1">
                      Enact on floor to unlock +${c.completion_bounty_millions}M bounty
                    </div>
                  </div>
                ))}
                {fulfilledContracts.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-stone-950 border border-emerald-600/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-200">{c.trade_group}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                        ✓ Enacted & Paid
                      </span>
                    </div>
                    <p className="text-stone-400 text-[11px]">"{c.suggested_bill_title || c.favor_title}"</p>
                    <div className="text-[10px] font-mono text-emerald-300 pt-1">
                      Paid +${c.completion_bounty_millions}M to Campaign War Chest
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
