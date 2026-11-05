import React, { useState } from 'react';
import { PoliticalBill, PoliticalSession, PoliticalDonorPromise } from '../../types';
import { api } from '../../api';
import { 
  X, FileText, CheckCircle2, AlertCircle, Plus, Sparkles, Building2, 
  Users, Award, Shield, Vote, ArrowRight, DollarSign, Handshake, Zap, Star 
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
  const [selectedDonorPromiseId, setSelectedDonorPromiseId] = useState<string | null>(null);
  const [createSubTab, setCreateSubTab] = useState<'donor_promises' | 'manual'>('donor_promises');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const pendingPromises = session.donor_promises?.filter(p => p.status === 'pending') || [];
  const selectedPromise = session.donor_promises?.find(p => p.id === selectedDonorPromiseId);

  const handleSelectDonorPromise = (p: PoliticalDonorPromise) => {
    setNewTitle(p.suggested_bill_title || p.promise_title);
    setNewCategory(p.statutory_category || 'general');
    setNewFiscalImpact(p.suggested_fiscal_impact || 15);
    setNewSummary(p.suggested_summary || p.promise_description);
    setSelectedDonorPromiseId(p.id);
    setCreateSubTab('manual');
  };

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
        summary: newSummary.trim(),
        donor_promise_id: selectedDonorPromiseId || undefined
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

              {/* Linked Donor Promise Banner */}
              {(() => {
                const linkedPromise = bill.donor_promise_id 
                  ? session.donor_promises?.find(p => p.id === bill.donor_promise_id)
                  : session.donor_promises?.find(p => p.legislated_bill_id === bill.id || p.suggested_bill_title === bill.title);
                if (!linkedPromise) return null;
                return (
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    linkedPromise.status === 'legislated'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <Handshake className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold">Donor Compact: {linkedPromise.donor_group}</span>
                        <p className="text-[11px] opacity-80 mt-0.5">"{linkedPromise.promise_title}"</p>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold shrink-0">
                      {linkedPromise.status === 'legislated' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-600/40 text-emerald-300">
                          ✅ +${linkedPromise.war_chest_reward_millions}M Paid
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-900/60 border border-amber-600/40 text-amber-300">
                          💰 +${linkedPromise.war_chest_reward_millions}M on Passage
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

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
            <div className="space-y-5">
              
              {/* Sub-tab Navigation */}
              <div className="flex items-center space-x-2 border-b border-stone-800 pb-3">
                <button
                  type="button"
                  onClick={() => setCreateSubTab('donor_promises')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    createSubTab === 'donor_promises'
                      ? 'bg-amber-950/80 border border-amber-600/50 text-amber-300 shadow'
                      : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Handshake className="w-3.5 h-3.5 text-amber-400" />
                  <span>Donor Commitments & Pledges</span>
                  {pendingPromises.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-mono font-bold">
                      {pendingPromises.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCreateSubTab('manual')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    createSubTab === 'manual'
                      ? 'bg-amber-950/80 border border-amber-600/50 text-amber-300 shadow'
                      : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Bill Drafting</span>
                </button>
              </div>

              {/* Sub-tab 1: Pending Donor Promises List */}
              {createSubTab === 'donor_promises' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                    <h4 className="text-sm font-bold text-stone-200 font-serif mb-1">
                      Draft Legislation From Campaign Donor Commitments
                    </h4>
                    <p className="text-xs text-stone-400">
                      Select a donor pledge below to automatically draft and refer its statutory language to committee. When the statute passes the floor, your campaign war chest receives the agreed payout!
                    </p>
                  </div>

                  {pendingPromises.length > 0 ? (
                    <div className="space-y-3">
                      {pendingPromises.map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-600/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">
                                {p.donor_group}
                              </span>
                              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400">
                                {p.statutory_category}
                              </span>
                              {p.is_controversial ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800/40 text-red-300 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-red-400" />
                                  <span>⚡ Divisive Special Interest</span>
                                </span>
                              ) : p.controversy_level === 'ethical' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  <span>✨ Clean Public Interest</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/40 text-amber-300 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-400" />
                                  <span>⚖️ Bipartisan Accord</span>
                                </span>
                              )}
                            </div>

                            <h5 className="font-bold text-sm text-stone-100 font-serif group-hover:text-amber-200">
                              {p.promise_title}
                            </h5>
                            <p className="text-xs text-stone-400 line-clamp-2">
                              {p.promise_description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-stone-400">
                              <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                                💰 +${p.war_chest_reward_millions}M War Chest on Enactment
                              </span>
                              <span>Support: <strong className="text-stone-300">{p.public_support}%</strong></span>
                              <span>Fiscal: <strong className="text-stone-300">{p.suggested_fiscal_impact > 0 ? `+$${p.suggested_fiscal_impact}B` : `-$${Math.abs(p.suggested_fiscal_impact)}B`}</strong></span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectDonorPromise(p)}
                            className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Draft Statute</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-500 space-y-3">
                      <p>No pending donor commitments logged on your ledger.</p>
                      <button
                        type="button"
                        onClick={() => setCreateSubTab('manual')}
                        className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
                      >
                        Proceed to Custom Bill Drafting
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Bill Drafting Form */}
              {createSubTab === 'manual' && (
                <form onSubmit={handleCreateBill} className="space-y-5">
                  {selectedPromise && (
                    <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-600/40 flex items-center justify-between text-xs text-amber-200">
                      <div className="flex items-center space-x-2">
                        <Handshake className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Fulfilling Promise to <strong>{selectedPromise.donor_group}</strong>: "{selectedPromise.promise_title}" 
                          <span className="ml-1 text-emerald-400 font-mono font-bold">(+${selectedPromise.war_chest_reward_millions}M on passage)</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDonorPromiseId(null)}
                        className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 text-[10px] font-bold"
                      >
                        Unlink
                      </button>
                    </div>
                  )}

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
          )}

        </div>
      </div>
    </div>
  );
};
