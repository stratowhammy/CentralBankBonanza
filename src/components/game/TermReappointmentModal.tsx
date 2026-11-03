import React, { useState, useEffect } from 'react';
import { TermReviewScorecard } from '../../types';
import { api } from '../../api';

interface TermReappointmentModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onReappointed: (newState: any, newChairState: any) => void;
}

export const TermReappointmentModal: React.FC<TermReappointmentModalProps> = ({
  sessionId,
  isOpen,
  onClose,
  onReappointed
}) => {
  const [loading, setLoading] = useState(true);
  const [scorecard, setScorecard] = useState<TermReviewScorecard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadScorecard();
    } else {
      setAccepted(false);
    }
  }, [isOpen, sessionId]);

  const loadScorecard = async () => {
    try {
      setLoading(true);
      const res = await api.getTermReview(sessionId);
      setScorecard(res.scorecard);
    } catch (err: any) {
      alert(err.message || 'Failed to load term review');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setSubmitting(true);
      const res = await api.acceptReappointment(sessionId);
      setAccepted(true);
      if (res.economic_state && res.chair_state) {
        onReappointed(res.economic_state, res.chair_state);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm reappointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t md:border border-indigo-500/50 rounded-t-[7vw] md:rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] md:max-h-[92vh]">
        {/* Android Drag Handle (Mobile Only) */}
        <div className="md:hidden w-[11vw] h-[0.55vh] min-h-[4px] rounded-full bg-slate-600/50 mx-auto my-[1.2vh] flex-shrink-0" />
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-indigo-500/30 flex items-center justify-between bg-gradient-to-r from-indigo-950/60 to-purple-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-2xl font-mono">
              🎖
            </span>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Quadrennial Mandate Review: 4-Year Term Milestone
              </h2>
              <p className="text-xs text-indigo-300/80">
                Official Parliamentary Reappointment Ceremony & Cumulative Scorecard
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
              Tabulating 48 months of macroeconomic data and Parliamentary records...
            </div>
          ) : accepted ? (
            <div className="p-8 text-center space-y-4 bg-slate-950/80 rounded-2xl border border-emerald-500/40 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-3xl font-bold">
                ★
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">
                Second 4-Year Mandate Confirmed
              </h3>
              <p className="text-sm text-slate-300 max-w-lg mx-auto">
                You have been officially sworn in for your second 4-year term as Central Bank Chair. Your institutional autonomy has been fortified, and your warning tally has been cleared.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Commence Second Mandate (Month 49)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Verdict Announcement */}
              <div className={`p-5 rounded-xl border text-center space-y-2 ${
                scorecard?.verdict === 'REAPPOINTED'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-100'
              }`}>
                <div className="text-xs uppercase tracking-wider font-semibold opacity-80">Official Determination</div>
                <div className="text-2xl font-serif font-bold">{scorecard?.verdict_title}</div>
                <p className="text-xs text-slate-300 italic max-w-xl mx-auto pt-1">
                  "{scorecard?.citation}"
                </p>
              </div>

              {/* 4-Year Scorecard Grid */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  4-Year Macroeconomic Stewardship Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Avg CPI Gap from 2%</div>
                    <div className="text-xl font-mono font-bold text-indigo-400 mt-1">±{scorecard?.avg_inflation_deviation}%</div>
                    <div className="text-[10px] text-slate-500">Benchmark: &lt; 2.5%</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Avg Real GDP Growth</div>
                    <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{scorecard?.avg_gdp_growth}%</div>
                    <div className="text-[10px] text-slate-500">Potential: 2.1%</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Avg Unemployment</div>
                    <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{scorecard?.avg_unemployment}%</div>
                    <div className="text-[10px] text-slate-500">NAIRU: 4.2%</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Parliament Approval</div>
                    <div className="text-xl font-mono font-bold text-amber-400 mt-1">{scorecard?.parliamentary_approval}%</div>
                    <div className="text-[10px] text-slate-500">Required: &gt; 40%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!accepted && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {scorecard?.verdict === 'REAPPOINTED'
                ? 'Parliament has ratified your re-nomination for an additional 48 months.'
                : 'Your mandate has reached term expiration.'}
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
              {scorecard?.verdict === 'REAPPOINTED' && (
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/30 disabled:opacity-50"
                >
                  {submitting ? 'Confirming Oath...' : 'Accept Second 4-Year Mandate'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
