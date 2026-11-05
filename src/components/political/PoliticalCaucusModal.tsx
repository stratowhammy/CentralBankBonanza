import React, { useState } from 'react';
import { CaucusDeal, PoliticalSession } from '../../types';
import { api } from '../../api';
import { 
  X, Users, Handshake, Shield, Sparkles, CheckCircle2, 
  AlertTriangle, DollarSign, ArrowRight, Vote, Award, Building2 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: PoliticalSession;
  onRefreshSession: () => void;
}

export const PoliticalCaucusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  session,
  onRefreshSession
}) => {
  const [isNegotiating, setIsNegotiating] = useState<string | null>(null);

  if (!isOpen) return null;

  const deals = session.caucus_deals || [];
  const pState = session.political_state;
  const currentCapital = pState.political_capital || 0;

  const handleNegotiate = async (dealId: string, action: 'accept' | 'counter' | 'reject') => {
    if (action === 'counter' && currentCapital < 8) {
      alert('You need at least 8 political capital to negotiate an amendment counter-offer.');
      return;
    }

    setIsNegotiating(dealId);
    try {
      const res = await api.negotiateCaucusDeal(session.id, dealId, action);
      alert(res.message);
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to negotiate caucus deal');
    } finally {
      setIsNegotiating(null);
    }
  };

  const pendingDeals = deals.filter(d => d.status === 'pending');
  const acceptedDeals = deals.filter(d => d.status === 'accepted');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm font-sans animate-fade-in">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 font-serif">
                Backroom Cloakroom & Caucus Logrolling
              </h3>
              <p className="text-xs text-stone-400 font-sans">
                Trade votes with faction leaders to assemble majority floor coalitions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-bold font-mono">
              Available Capital: {currentCapital} pts
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          
          {/* Explanation Banner */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300 flex items-start space-x-3">
            <Handshake className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-stone-100 mb-0.5">The Art of Legislative Logrolling</p>
              <p className="text-stone-400 leading-relaxed">
                Passing landmark legislation requires cutting backroom deals with independent caucuses. 
                Faction chairs will support your priority docket on the floor in exchange for your commitment to vote YES on their signature bills.
              </p>
            </div>
          </div>

          {/* Pending Delegation Offers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-amber-200 uppercase tracking-wider font-mono">
                Active Delegation Trade Offers ({pendingDeals.length})
              </h4>
              <span className="text-[11px] text-stone-400">Review terms & negotiate floor swaps</span>
            </div>

            {pendingDeals.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {pendingDeals.map(deal => (
                  <div
                    key={deal.id}
                    className="p-5 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/40 transition-all space-y-4 shadow-lg"
                  >
                    {/* Caucus Identity & Leader */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-850 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center font-bold text-amber-300 text-xs">
                          {deal.caucus_leader.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-stone-100 font-serif">{deal.caucus_leader}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/40 text-amber-300 font-bold">
                              {deal.member_count} Members
                            </span>
                          </div>
                          <p className="text-xs text-stone-400">{deal.caucus_name} • {deal.ideology}</p>
                        </div>
                      </div>

                      <div className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-bold font-mono">
                        +{deal.pledged_votes} Floor Votes Pledged
                      </div>
                    </div>

                    {/* Trade Terms: What they want vs what they give */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      
                      {/* What they want */}
                      <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-rose-400 block font-mono">
                          THEY REQUIRE YOUR VOTE ON:
                        </span>
                        <div className="font-bold text-stone-200">{deal.docket_bill_title}</div>
                        <p className="text-stone-400 text-[11px] leading-snug">{deal.docket_bill_summary}</p>
                        <div className="pt-1 flex items-center space-x-2 font-mono text-[10px] text-stone-500">
                          <span>Cat: {deal.docket_bill_category}</span>
                          <span>•</span>
                          <span>Fiscal: {deal.docket_bill_impact > 0 ? `+$${deal.docket_bill_impact}B` : `-$${Math.abs(deal.docket_bill_impact)}B`}</span>
                        </div>
                      </div>

                      {/* What they give */}
                      <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono">
                          THEY DELIVER TO YOUR BILL:
                        </span>
                        <div className="font-bold text-stone-200">
                          {deal.user_target_bill_title || 'Your Active Legislative Docket'}
                        </div>
                        <p className="text-stone-400 text-[11px] leading-snug">
                          {deal.demands_description}
                        </p>
                        <div className="pt-1 font-mono text-emerald-400 text-[11px] font-bold">
                          ✓ Guaranteed floor bloc: {deal.pledged_votes} Ayes on roll-call
                        </div>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                      <button
                        onClick={() => handleNegotiate(deal.id, 'reject')}
                        disabled={isNegotiating === deal.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 text-xs font-bold transition-all"
                      >
                        Decline Offer
                      </button>

                      <button
                        onClick={() => handleNegotiate(deal.id, 'counter')}
                        disabled={isNegotiating === deal.id || currentCapital < 8}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl border border-cyan-700/60 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center space-x-1"
                        title="Spend 8 Political Capital to insert carve-outs and secure +5 extra votes"
                      >
                        <span>Counter-Offer: Add Carve-Out (-8 Capital)</span>
                        <span className="text-[10px] font-mono text-cyan-400">(+5 votes)</span>
                      </button>

                      <button
                        onClick={() => handleNegotiate(deal.id, 'accept')}
                        disabled={isNegotiating === deal.id}
                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-stone-950 text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Seal Logroll Accord</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-stone-950 border border-stone-800 text-stone-500 text-xs">
                No active delegation offers pending. Draft new legislation or advance to next month for caucus leaders to visit your cloakroom.
              </div>
            )}
          </div>

          {/* Active Sealed Accords */}
          {acceptedDeals.length > 0 && (
            <div className="pt-4 border-t border-stone-800">
              <h4 className="font-bold text-xs text-stone-300 uppercase tracking-wider font-mono mb-3">
                Sealed Backroom Accords ({acceptedDeals.length})
              </h4>
              <div className="space-y-2">
                {acceptedDeals.map(deal => (
                  <div
                    key={deal.id}
                    className="p-3.5 rounded-xl bg-stone-950 border border-emerald-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-stone-200">{deal.caucus_leader} ({deal.caucus_name})</span>
                        <p className="text-[11px] text-stone-400">
                          Pledged to: <span className="text-amber-300">{deal.user_target_bill_title}</span> • In exchange for: <span className="text-stone-300">{deal.docket_bill_title}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/40">
                      +{deal.pledged_votes} Floor Votes Locked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase tracking-wider"
          >
            Close Cloakroom
          </button>
        </div>

      </div>
    </div>
  );
};
