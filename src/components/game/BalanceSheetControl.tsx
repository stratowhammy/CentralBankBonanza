import React, { useState } from 'react';
import { EconomicState } from '../../types';

interface BalanceSheetControlProps {
  economicState: EconomicState;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (params: { qt_monthly_pace?: number; discount_window_active?: boolean }) => Promise<void>;
}

export const BalanceSheetControl: React.FC<BalanceSheetControlProps> = ({
  economicState,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [qtPace, setQtPace] = useState<number>(economicState.qt_monthly_pace ?? -25);
  const [discountActive, setDiscountActive] = useState<boolean>(economicState.discount_window_active ?? false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    try {
      setSaving(true);
      await onUpdate({
        qt_monthly_pace: qtPace,
        discount_window_active: discountActive
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update balance sheet operations');
    } finally {
      setSaving(false);
    }
  };

  const currentSize = economicState.balance_sheet_size ?? 7.2;
  const discountRate = economicState.discount_window_rate ?? (economicState.interest_rate + 1.0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/75 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t md:border border-slate-700 rounded-t-[7vw] md:rounded-2xl w-full max-w-2xl max-h-[88vh] md:max-h-none overflow-y-auto shadow-2xl flex flex-col">
        {/* Android Drag Handle (Mobile Only) */}
        <div className="md:hidden w-[11vw] h-[0.55vh] min-h-[4px] rounded-full bg-slate-600/50 mx-auto my-[1.2vh] flex-shrink-0" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xl font-mono">
              🏛
            </span>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Central Bank Balance Sheet & Liquidity Desk
              </h2>
              <p className="text-xs text-slate-400">
                Quantitative Easing/Tightening and Emergency Discount Window Operations
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

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Telemetry Overview */}
          <div className="grid grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Total Asset Portfolio</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">${currentSize.toFixed(2)}T</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sovereign Bonds & MBS</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Monthly Runoff / Injection</div>
              <div className={`text-2xl font-bold font-mono ${qtPace < 0 ? 'text-amber-400' : qtPace > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {qtPace > 0 ? `+$${qtPace}B` : qtPace < 0 ? `-$${Math.abs(qtPace)}B` : '$0B'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{qtPace < 0 ? 'Quantitative Tightening' : qtPace > 0 ? 'Quantitative Easing' : 'Neutral Portfolio'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Discount Window Rate</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{discountRate.toFixed(2)}%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Bagehot Penalty Rate (+100 bps)</div>
            </div>
          </div>

          {/* QT/QE Pace Slider */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-slate-200">
                  Quantitative Tightening (QT) / Easing (QE) Monthly Pace
                </label>
                <p className="text-xs text-slate-400">
                  Allow bonds to mature without reinvestment (QT) to lift term premia, or purchase debt (QE) to compress yields.
                </p>
              </div>
              <span className={`text-sm font-mono font-bold px-2 py-1 rounded border ${
                qtPace < 0 
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/30' 
                  : qtPace > 0 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {qtPace < 0 ? `QT: -$${Math.abs(qtPace)}B / mo` : qtPace > 0 ? `QE: +$${qtPace}B / mo` : 'Neutral: $0B'}
              </span>
            </div>

            <div className="pt-2">
              <input
                type="range"
                min="-60"
                max="60"
                step="5"
                value={qtPace}
                onChange={(e) => setQtPace(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                <span>-$60B (Max QT)</span>
                <span>-$25B (Standard QT)</span>
                <span>$0 (Reinvest)</span>
                <span>+$25B (Mild QE)</span>
                <span>+$60B (Aggressive QE)</span>
              </div>
            </div>
          </div>

          {/* Emergency Discount Window Toggle */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="pr-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">
                  Emergency Discount Window Standing Liquidity Facility
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                  discountActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {discountActive ? 'Facility Open' : 'Facility Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Under Walter Bagehot’s classic rule, open the discount window during bank liquidity stress to lend freely against sound collateral at a penalty rate ({discountRate.toFixed(2)}%). Calms interbank runs but increases parliamentary oversight scrutiny.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDiscountActive(!discountActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                discountActive ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  discountActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            Changes take effect during the ongoing monthly transmission cycle.
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            >
              {saving ? 'Applying Operations...' : 'Confirm Balance Sheet Operations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
