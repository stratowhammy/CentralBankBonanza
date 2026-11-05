import React, { useState } from 'react';
import { PoliticalBill, PoliticalSession } from '../../types';
import { api } from '../../api';
import { 
  X, FileText, CheckCircle2, AlertCircle, Plus, Sparkles, Building2, 
  Users, Award, Shield, Vote, ArrowRight 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: PoliticalBill | null;
  session: PoliticalSession;
  onRefreshSession: () => void;
  onOpenWhipModal?: (bill: PoliticalBill) => void;
}

export const PoliticalBillModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bill,
  session,
  onRefreshSession,
  onOpenWhipModal
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'create'>(bill ? 'view' : 'create');

  // New bill state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('infrastructure');
  const [newFiscalImpact, setNewFiscalImpact] = useState(20);
  const [newSummary, setNewSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCapital = session.political_state.political_capital || 0;
  const floorMomentum = Math.round(((bill?.committee_sway_level || 0) * 3.5) + ((bill?.committee_amendments_count || 0) * 6));

  const handleSway = async (swayType: 'member' | 'amendment') => {
    if (!bill) return;
    const cost = swayType === 'amendment' ? 10 : 5;
    if (currentCapital < cost) {
      alert(`Insufficient political capital. You need at least ${cost} capital (you have ${currentCapital}).`);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.swayCommittee(session.id, bill.id, swayType);
      alert(res.sway_result.message);
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to sway committee members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommitteeMarkup = async () => {
    if (!bill) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitBillToCommittee(session.id, bill.id);
      alert(res.committee_result.message);
      onRefreshSession();
      if (res.committee_result.passed) {
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Failed committee markup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await api.draftPoliticalBill(session.id, {
        title: newTitle.trim(),
        category: newCategory,
        fiscal_impact_billions: Number(newFiscalImpact),
        summary: newSummary.trim()
      });
      alert(`Legislation '${newTitle}' drafted and submitted to committee!`);
      onRefreshSession();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to draft bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm font-sans animate-fade-in">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 font-serif">
                {activeTab === 'view' && bill ? bill.title : 'Author New Statutory Bill'}
              </h3>
              <p className="text-xs text-stone-400 font-sans">
                {activeTab === 'view' && bill ? `Status: ${bill.status.toUpperCase()} • Committee: ${bill.committee_name || 'Standing'}` : 'Draft legislation with dedicated fiscal offsets'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {bill && (
              <div className="flex rounded-lg border border-stone-800 bg-stone-900 p-0.5 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('view')}
                  className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'view' ? 'bg-amber-600 text-stone-950' : 'text-stone-400'}`}
                >
                  View Statute
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'create' ? 'bg-amber-600 text-stone-950' : 'text-stone-400'}`}
                >
                  Draft New
                </button>
              </div>
            )}

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
          
          {activeTab === 'view' && bill && (
            <div className="space-y-6">
              
              {/* Metadata Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="text-stone-500 font-sans">Category</div>
                  <div className="font-bold text-amber-300 capitalize">{bill.category}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="text-stone-500 font-sans">Appropriation</div>
                  <div className="font-bold font-mono text-emerald-400">
                    {bill.fiscal_impact_billions > 0 ? `+$${bill.fiscal_impact_billions}B` : `-$${Math.abs(bill.fiscal_impact_billions)}B`}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="text-stone-500 font-sans">Achievement Value</div>
                  <div className="font-bold font-mono text-amber-400">⭐️ {bill.achievement_score || 5} / 20 pts</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="text-stone-500 font-sans">Public Favorable</div>
                  <div className="font-bold text-stone-200">{bill.public_support || 60}%</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="text-stone-500 font-sans">Status</div>
                  <div className="font-bold text-cyan-300 capitalize">{bill.status.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Statutory Parchment Reader */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Official Statutory Language
                </label>
                <div className="p-5 rounded-2xl bg-amber-50/5 border border-amber-900/30 text-stone-300 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto selection:bg-amber-900 selection:text-amber-100 shadow-inner">
                  {bill.statutory_text}
                </div>
              </div>

              {/* Committee Markup & Political Capital Sway Deck */}
              {bill.status === 'in_committee' && (
                <div className="p-5 rounded-2xl bg-stone-950 border border-amber-600/30 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-sm text-amber-200 font-serif">
                          Committee Deliberations: {bill.committee_name || 'Standing Committee'}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        24 Members Total • 13 Votes Needed to Report Out Favorably
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-bold font-mono">
                      Available Capital: {currentCapital} pts
                    </div>
                  </div>

                  {/* Sway Status Progress Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <span className="text-[10px] uppercase text-stone-400 block font-bold">Members Swayed</span>
                      <span className="text-base font-bold text-amber-300 font-mono">
                        {bill.committee_sway_level || 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <span className="text-[10px] uppercase text-stone-400 block font-bold">Markup Amendments</span>
                      <span className="text-base font-bold text-cyan-300 font-mono">
                        {bill.committee_amendments_count || 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <span className="text-[10px] uppercase text-stone-400 block font-bold">Floor Momentum</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        +{floorMomentum} Votes
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <span className="text-[10px] uppercase text-stone-400 block font-bold">Caucus Pledged</span>
                      <span className="text-base font-bold text-amber-400 font-mono">
                        +{bill.pledged_caucus_votes || 0} Votes
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400">
                    Passing bills on the floor is extremely difficult without building committee consensus. 
                    Spend political capital to sway swing members and pass markup amendments to guarantee favorable reporting and prime floor momentum.
                  </p>

                  {/* Interactive Sway Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={() => handleSway('member')}
                      disabled={isSubmitting || currentCapital < 5}
                      className="p-3 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-500 text-left transition-all disabled:opacity-40 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-stone-200">🤝 Sway Swing Member</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold">-5 Capital</span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug">
                        Recruits a moderate co-sponsor. Adds +2 committee votes and +3.5 floor momentum votes.
                      </p>
                    </button>

                    <button
                      onClick={() => handleSway('amendment')}
                      disabled={isSubmitting || currentCapital < 10}
                      className="p-3 rounded-xl bg-stone-900 border border-stone-700 hover:border-cyan-500 text-left transition-all disabled:opacity-40 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-cyan-200">📜 Markup Amendment</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">-10 Capital</span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug">
                        Adopts bipartisan compromise. Adds +4 committee votes, +6 floor votes, and +4% public approval.
                      </p>
                    </button>

                    <button
                      onClick={handleCommitteeMarkup}
                      disabled={isSubmitting}
                      className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-stone-950 font-bold text-xs uppercase tracking-wider flex flex-col justify-center items-center text-center shadow-lg transition-all active:scale-98 cursor-pointer"
                    >
                      <Vote className="w-5 h-5 mb-1 text-stone-950" />
                      <span>{isSubmitting ? 'Holding Vote...' : 'Call Markup Vote'}</span>
                      <span className="text-[10px] font-normal opacity-90">Report Out to Floor</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Floor Debate State Banner */}
              {bill.status === 'floor_debate' && (
                <div className="p-5 rounded-2xl bg-stone-950 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-bold text-sm">Reported Out of Committee to Floor</span>
                    </div>
                    <span className="text-xs font-mono text-stone-300">
                      Markup Result: {bill.committee_vote_aye || 14} Ayes — {bill.committee_vote_nay || 10} Nays
                    </span>
                  </div>

                  <p className="text-xs text-stone-400">
                    This statute carries <strong className="text-emerald-300">+{floorMomentum} Committee Momentum Votes</strong> and <strong className="text-amber-300">+{bill.pledged_caucus_votes || 0} Pledged Caucus Votes</strong> directly into the floor division!
                  </p>

                  {onOpenWhipModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenWhipModal(bill);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Convene Whip Board & Execute Floor Division</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateBill} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Bill Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. National High-Speed Rail & Port Modernization Act"
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Policy Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="infrastructure">Infrastructure & Transportation</option>
                    <option value="energy">Clean Energy & Grid Resilience</option>
                    <option value="healthcare">Healthcare & Drug Affordability</option>
                    <option value="housing">Housing Construction & Mortgages</option>
                    <option value="technology">Semiconductors, AI & Telecommunications</option>
                    <option value="trade">Trade, Tariffs & Manufacturing</option>
                    <option value="fiscal">Taxation & Deficit Reduction</option>
                    <option value="defense">National Security & Defense</option>
                    <option value="justice">Public Safety & Criminal Justice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Appropriation Impact ($ Billions)
                  </label>
                  <input
                    type="number"
                    value={newFiscalImpact}
                    onChange={e => setNewFiscalImpact(Number(e.target.value))}
                    step="1"
                    placeholder="e.g. 25 (positive for spending, negative for deficit reduction)"
                    className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Executive Summary / Legislative Intent
                </label>
                <textarea
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Outline the core provisions, targeted economic sectors, and regional impacts of this statute..."
                  rows={4}
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Drafting Statute...' : 'Submit to Committee'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
