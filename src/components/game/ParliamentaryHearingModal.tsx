import React, { useState, useEffect } from 'react';
import { ParliamentaryHearingData } from '../../types';
import { api } from '../../api';

interface ParliamentaryHearingModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onTestimonyComplete: (newEconomicState: any) => void;
}

export const ParliamentaryHearingModal: React.FC<ParliamentaryHearingModalProps> = ({
  sessionId,
  isOpen,
  onClose,
  onTestimonyComplete
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hearingData, setHearingData] = useState<ParliamentaryHearingData | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<Record<string, string>>({});
  const [testimonyResult, setTestimonyResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadHearing();
    } else {
      setTestimonyResult(null);
      setSelectedStrategies({});
    }
  }, [isOpen, sessionId]);

  const loadHearing = async () => {
    try {
      setLoading(true);
      const res = await api.getParliamentHearing(sessionId);
      setHearingData(res.hearing);
      // Pre-select first strategy for each question
      const initial: Record<string, string> = {};
      res.hearing.questions.forEach((q: any) => {
        initial[q.id] = q.strategies[0].key;
      });
      setSelectedStrategies(initial);
    } catch (err: any) {
      alert(err.message || 'Failed to load parliamentary hearing questions');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyChange = (questionId: string, strategyKey: string) => {
    setSelectedStrategies(prev => ({
      ...prev,
      [questionId]: strategyKey
    }));
  };

  const handleSubmitTestimony = async () => {
    try {
      setSubmitting(true);
      const res = await api.submitParliamentHearing(sessionId, selectedStrategies);
      setTestimonyResult(res);
      if (res.economic_state) {
        onTestimonyComplete(res.economic_state);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit testimony');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/75 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t md:border border-amber-500/40 rounded-t-[7vw] md:rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] md:max-h-[92vh]">
        {/* Android Drag Handle (Mobile Only) */}
        <div className="md:hidden w-[11vw] h-[0.55vh] min-h-[4px] rounded-full bg-slate-600/50 mx-auto my-[1.2vh] flex-shrink-0" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-500/30 flex items-center justify-between bg-amber-950/20">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xl font-mono">
              🏛
            </span>
            <div>
              <h2 className="text-xl font-serif font-bold text-amber-100 tracking-wide">
                Parliamentary Treasury Select Committee Question Time
              </h2>
              <p className="text-xs text-amber-300/70">
                Statutory Oversight Hearing • Televised Testimony on Monetary Policy
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
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-sm">
              Preparing Committee hearing transcript and summons...
            </div>
          ) : testimonyResult ? (
            /* Results Screen */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-6 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-serif font-bold text-white">
                  Hearing Concluded & Entered into Parliamentary Record
                </h3>
                <p className="text-sm text-slate-300 max-w-xl mx-auto">
                  {testimonyResult.summary}
                </p>
              </div>

              {/* Updated Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
                <div>
                  <div className="text-xs uppercase text-slate-400">Parliamentary Approval</div>
                  <div className="text-2xl font-bold font-mono text-indigo-400">{testimonyResult.parliamentary_approval}%</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400">Public Approval</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400">{testimonyResult.public_approval}%</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400">Statutory Autonomy</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">{testimonyResult.central_bank_autonomy}%</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400">Market Credibility</div>
                  <div className="text-2xl font-bold font-mono text-amber-400">{testimonyResult.market_credibility}%</div>
                </div>
              </div>
            </div>
          ) : (
            /* Questions Form */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-sm text-slate-300 flex items-center justify-between">
                <div>
                  You are seated at the witness witness table in Committee Room 14. 
                  Lawmakers from both the government and opposition benches are ready to cross-examine your stewardship.
                </div>
                <div className="text-right text-xs text-amber-400 font-mono">
                  Approval: <strong>{hearingData?.parliamentary_approval}%</strong>
                </div>
              </div>

              {hearingData?.questions.map((q, qIndex) => (
                <div key={q.id} className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs flex items-center justify-center font-bold">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                        {q.interrogator}
                      </span>
                    </div>
                    <blockquote className="text-sm font-serif text-slate-100 italic border-l-2 border-amber-500/50 pl-3 py-1 mt-2">
                      "{q.question}"
                    </blockquote>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Select Response Strategy:
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {q.strategies.map((strat) => {
                        const isSelected = selectedStrategies[q.id] === strat.key;
                        return (
                          <div
                            key={strat.key}
                            onClick={() => handleStrategyChange(q.id, strat.key)}
                            className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm shadow-amber-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-xs text-amber-200">
                                {strat.label}
                              </span>
                              <div className="text-[10px] font-mono text-slate-400 space-x-2">
                                <span className={strat.parl_approval_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  Parl: {strat.parl_approval_delta >= 0 ? '+' : ''}{strat.parl_approval_delta}%
                                </span>
                                <span className={strat.autonomy_delta >= 0 ? 'text-indigo-400' : 'text-rose-400'}>
                                  Autonomy: {strat.autonomy_delta >= 0 ? '+' : ''}{strat.autonomy_delta}%
                                </span>
                                <span className={strat.market_credibility_delta >= 0 ? 'text-cyan-400' : 'text-rose-400'}>
                                  Cred: {strat.market_credibility_delta >= 0 ? '+' : ''}{strat.market_credibility_delta}%
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 italic">
                              "{strat.dialogue}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            {testimonyResult ? 'Session transcript archived in Parliamentary Annals.' : 'Choose your words carefully; live gavel-to-gavel coverage is broadcast nationwide.'}
          </span>
          <div className="flex gap-3">
            {testimonyResult ? (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Return to Central Bank Desk
              </button>
            ) : (
              <button
                onClick={handleSubmitTestimony}
                disabled={submitting || loading}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-amber-900/30 disabled:opacity-50"
              >
                {submitting ? 'Delivering Testimony...' : 'Deliver Official Testimony'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
