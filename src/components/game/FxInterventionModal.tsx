import React, { useState } from 'react';
import { GameSession } from '../../types';
import { api } from '../../api';
import { 
  X, 
  Coins, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface FxInterventionModalProps {
  session: GameSession;
  isOpen: boolean;
  onClose: () => void;
  onInterventionComplete: (updatedSession: GameSession) => void;
}

export const FxInterventionModal: React.FC<FxInterventionModalProps> = ({
  session,
  isOpen,
  onClose,
  onInterventionComplete,
}) => {
  const [actionType, setActionType] = useState<'defend_currency' | 'accumulate_reserves'>('defend_currency');
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const econ = session.economic_state;
  const reserves = econ.fx_reserves_billions ?? 50.0;
  const currency = econ.currency_index ?? 100.0;
  const capitalFlow = econ.capital_flow_momentum ?? 0.0;
  const benchmarkRate = econ.foreign_benchmark_rate ?? 4.50;
  const sovereignSpread = econ.sovereign_risk_spread ?? 150;

  const isLowReserves = reserves < 25.0;
  const isCriticalReserves = reserves < 15.0;

  const handleExecute = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const res = await api.executeFxIntervention(session.id, {
        action_type: actionType,
        amount_billions: amount,
      });

      setSuccessMessage(res.message || 'Intervention executed successfully');

      // Re-fetch fresh session
      const fresh = await api.getSession(session.id);
      if (fresh?.session) {
        onInterventionComplete(fresh.session);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute foreign exchange intervention');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coins className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Foreign Exchange Reserve Desk
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                  {session.economy_type === 'small_emerging' ? 'Small Open Economy' : 'Middle Advanced Open'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct open-market currency interventions to manage FX volatility and external debt solvency.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* External Market State Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${isCriticalReserves ? 'bg-rose-950/40 border-rose-500/60' : isLowReserves ? 'bg-amber-950/40 border-amber-500/50' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">FX Reserves</span>
              <span className={`font-mono text-xl font-bold ${isCriticalReserves ? 'text-rose-400' : isLowReserves ? 'text-amber-400' : 'text-emerald-400'}`}>
                ${reserves.toFixed(1)}B
              </span>
              <span className="text-[10px] text-slate-500 block">
                {isCriticalReserves ? 'Critical depletion!' : isLowReserves ? 'Below safety buffer' : 'Adequate buffer'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Currency Index</span>
              <span className={`font-mono text-xl font-bold ${currency < 95 ? 'text-rose-400' : (currency > 105 ? 'text-cyan-400' : 'text-slate-200')}`}>
                {currency.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Baseline: 100.0
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Capital Flows</span>
              <span className={`font-mono text-xl font-bold ${capitalFlow < -2 ? 'text-rose-400' : (capitalFlow > 2 ? 'text-emerald-400' : 'text-slate-300')}`}>
                {capitalFlow >= 0 ? `+$${capitalFlow.toFixed(1)}B` : `-$${Math.abs(capitalFlow).toFixed(1)}B`}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {capitalFlow < -2 ? 'Net capital flight' : 'Net capital inflow'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Sovereign Spread</span>
              <span className={`font-mono text-xl font-bold ${sovereignSpread > 300 ? 'text-rose-400' : (sovereignSpread > 150 ? 'text-amber-400' : 'text-slate-200')}`}>
                +{sovereignSpread} bps
              </span>
              <span className="text-[10px] text-slate-500 block">
                over Fed/ECB ({benchmarkRate.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Critical Warnings */}
          {isCriticalReserves && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/70 flex items-start gap-3 text-rose-200 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Severe Reserve Depletion Warning</span>
                Foreign reserves have plunged below $15B. Further interventions risk exhausting national liquidity, triggering sovereign debt default speculation or emergency multilateral bailout talks.
              </div>
            </div>
          )}

          {/* Action Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Select Intervention Strategy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType('defend_currency')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  actionType === 'defend_currency'
                    ? 'bg-amber-500/20 border-amber-400 text-slate-100 shadow-lg ring-1 ring-amber-400'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm flex items-center gap-1.5 text-amber-300">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Defend Currency (Sell Reserves)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    Anti-Depreciation
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Deploy foreign exchange reserves into the open market to absorb selling pressure, bolster the exchange rate, and tame imported inflation spikes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActionType('accumulate_reserves')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  actionType === 'accumulate_reserves'
                    ? 'bg-cyan-500/20 border-cyan-400 text-slate-100 shadow-lg ring-1 ring-cyan-400'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm flex items-center gap-1.5 text-cyan-300">
                    <TrendingDown className="w-4 h-4 text-amber-400" />
                    Accumulate Reserves (Buy FX)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    Build War Chest
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Purchase foreign currencies using domestic liquidity. Restores the national reserve cushion and prevents rapid currency overvaluation that hurts exporters.
                </p>
              </button>
            </div>
          </div>

          {/* Amount Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300 uppercase tracking-wider">
                Intervention Tranche Size
              </label>
              <span className="font-mono font-bold text-amber-300 text-sm">
                ${amount} Billion
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  disabled={actionType === 'defend_currency' && reserves < amt}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition ${
                    amount === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  ${amt}B
                </button>
              ))}
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 flex items-center gap-2 text-rose-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 flex items-center gap-2 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-500">
            {actionType === 'defend_currency'
              ? `Estimated post-operation reserve balance: $${Math.max(0, reserves - amount).toFixed(1)}B`
              : `Estimated post-operation reserve balance: $${(reserves + amount).toFixed(1)}B`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={loading || (actionType === 'defend_currency' && reserves < amount)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg hover:shadow-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  Transacting...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Execute Desk Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
