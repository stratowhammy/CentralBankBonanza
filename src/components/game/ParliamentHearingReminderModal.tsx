import React, { useState } from 'react';
import { Landmark, AlertTriangle, ShieldAlert, CheckCircle, ArrowRight, X } from 'lucide-react';

interface ParliamentHearingReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttend: () => void;
  onDecline: () => Promise<void>;
  currentMonth: number;
  currentYear: number;
}

export const ParliamentHearingReminderModal: React.FC<ParliamentHearingReminderModalProps> = ({
  isOpen,
  onClose,
  onAttend,
  onDecline,
  currentMonth,
  currentYear
}) => {
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [declining, setDeclining] = useState(false);

  if (!isOpen) return null;

  const handleConfirmDecline = async () => {
    try {
      setDeclining(true);
      await onDecline();
      setShowDeclineConfirm(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to process declined hearing');
    } finally {
      setDeclining(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parliament-summons-title"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner flex-shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Statutory Oversight Required
              </span>
              <h3 id="parliament-summons-title" className="text-lg font-bold text-slate-100 font-prestige">
                Parliamentary Summons in Progress
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          {!showDeclineConfirm ? (
            <>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>You Must Attend Question Time This Month</span>
                </div>
                <p className="text-xs text-amber-100/90 leading-normal">
                  The Parliamentary Treasury Select Committee has formally convened for <strong className="text-amber-300">Month {currentMonth} (Year {currentYear})</strong>.
                  Under the Central Bank Act, the Governor is summoned to testify before lawmakers prior to advancing policy decisions.
                </p>
              </div>

              <p className="text-slate-300">
                Lawmakers have prepared direct interrogations regarding your policy stance, inflation progress, mortgage pain, and economic stability.
                You must appear for testimony before the Committee or explicitly decline with statutory penalties.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onAttend}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all active:scale-98 cursor-pointer"
                >
                  <Landmark className="w-4 h-4" />
                  <span>Attend Hearing (Testify)</span>
                </button>

                <button
                  onClick={() => setShowDeclineConfirm(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/50 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Decline / Skip Hearing</span>
                </button>
              </div>
            </>
          ) : (
            /* Decline Confirmation with Penalties */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <span>Contempt of Parliament Sanctions Warning</span>
                </div>
                <p className="text-xs text-rose-100/90 leading-relaxed">
                  Refusing a statutory summons from the Parliamentary Select Committee constitutes defiance of legislative oversight.
                  The following mandatory institutional penalties will be applied immediately:
                </p>

                <div className="bg-slate-950/80 rounded-xl p-3 border border-rose-500/30 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-rose-300">
                    <span>Parliamentary Approval:</span>
                    <strong className="text-rose-400">-18.0%</strong>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Public Approval:</span>
                    <strong className="text-rose-400">-12.0%</strong>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Market Credibility:</span>
                    <strong className="text-rose-400">-6.0%</strong>
                  </div>
                  <div className="flex justify-between text-amber-300 border-t border-slate-800 pt-1 mt-1">
                    <span>Formal Parliamentary Reprimand:</span>
                    <strong className="text-amber-400">+1 Formal Warning</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 italic font-sans pt-1">
                    ⚠️ 3 Formal Warnings trigger immediate dismissal and a Vote of No Confidence.
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleConfirmDecline}
                  disabled={declining}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{declining ? 'Sanctioning...' : 'Yes, Decline & Accept Penalties'}</span>
                </button>

                <button
                  onClick={() => setShowDeclineConfirm(false)}
                  disabled={declining}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Cancel / Return</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
