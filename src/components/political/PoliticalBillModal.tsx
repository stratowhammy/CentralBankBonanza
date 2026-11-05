import React, { useState } from 'react';
import { PoliticalBill, PoliticalSession } from '../../types';
import { api } from '../../api';
import { X, FileText, CheckCircle2, AlertCircle, Plus, Sparkles, Building2 } from 'lucide-react';

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

  const handleCommitteeMarkup = async () => {
    if (!bill) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitBillToCommittee(session.id, bill.id);
      alert(res.committee_result.message);
      onRefreshSession();
      onClose();
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
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
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
                <div className="p-6 rounded-2xl bg-amber-50/5 border border-amber-900/30 text-stone-300 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto selection:bg-amber-900 selection:text-amber-100 shadow-inner">
                  {bill.statutory_text}
                </div>
              </div>

              {/* Committee Actions */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-stone-200">Committee Markup & Whip Status</div>
                  <div className="text-xs text-stone-400">
                    {bill.status === 'in_committee' 
                      ? 'Bill is currently awaiting markup in your committee. Hold hearing to vote it out to the floor.'
                      : bill.status === 'floor_debate'
                      ? 'Bill has been voted out of committee and is cleared for floor debate and whip calculations.'
                      : `Bill has concluded floor proceedings with status: ${bill.status.toUpperCase()}.`}
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {bill.status === 'in_committee' && (
                    <button
                      onClick={handleCommitteeMarkup}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Holding Markup...' : 'Vote Out of Committee'}</span>
                    </button>
                  )}

                  {bill.status === 'floor_debate' && onOpenWhipModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenWhipModal(bill);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Open Whip Board & Floor Vote</span>
                    </button>
                  )}
                </div>
              </div>

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
                    <option value="housing">Housing & Zoning Reform</option>
                    <option value="technology">Technology & Semiconductors</option>
                    <option value="fiscal">Tax Reform & Fiscal Prudence</option>
                    <option value="justice">Public Safety & Safe Streets</option>
                    <option value="defense">National Defense & Cyber Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    5-Year Appropriation ($ Billions)
                  </label>
                  <input
                    type="number"
                    value={newFiscalImpact}
                    onChange={e => setNewFiscalImpact(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Executive Findings & Objectives
                </label>
                <textarea
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Outline the core provisions and intended benefits for your district and the nation..."
                  rows={4}
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Authoring Statute...' : 'Draft & Refer to Committee'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
