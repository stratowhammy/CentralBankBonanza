import React, { useState } from 'react';
import { GameSession, ActionType } from '../../types';
import { 
  X, 
  Vote, 
  BellRing, 
  VolumeX, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface MonthlyActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: GameSession;
  onSubmitAction: (params: {
    action_type: ActionType;
    action_value?: string;
    statement?: string;
  }) => Promise<void>;
}

export const MonthlyActionModal: React.FC<MonthlyActionModalProps> = ({
  isOpen,
  onClose,
  session,
  onSubmitAction
}) => {
  const monthInQuarter = session.month_in_quarter; // 1, 2, or 3
  const isMpcMonth = monthInQuarter === 3;

  // Month 1 & 2 state
  const [guidanceChoice, setGuidanceChoice] = useState<'silence' | 'hawkish' | 'dovish' | 'neutral'>('silence');
  const [guidanceStatement, setGuidanceStatement] = useState('');

  // Month 3 state (Quarter-percent rate decision: -100 to +100 bps)
  const [rateDecisionBps, setRateDecisionBps] = useState<number>(0);
  const [pressStatement, setPressStatement] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRate = session.economic_state.interest_rate;
  const newRate = Number((currentRate + rateDecisionBps / 100).toFixed(2));
  const taylorRule = session.taylor_rule;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isMpcMonth) {
        await onSubmitAction({
          action_type: 'mpc_rate_decision',
          action_value: String(rateDecisionBps),
          statement: pressStatement.trim() || undefined
        });
      } else {
        if (guidanceChoice === 'silence') {
          await onSubmitAction({
            action_type: 'silence',
            action_value: '0',
            statement: 'The Central Bank Chair elected to make no public policy statement this month.'
          });
        } else {
          await onSubmitAction({
            action_type: 'guidance',
            action_value: guidanceChoice,
            statement: guidanceStatement.trim() || `The Central Bank Chair delivered a ${guidanceChoice} forward guidance speech.`
          });
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
            isMpcMonth 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {isMpcMonth ? <Vote className="w-6 h-6" /> : <BellRing className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="font-prestige text-xl font-bold text-slate-100">
              {isMpcMonth ? 'Quarterly Monetary Policy Committee Meeting' : `Month ${monthInQuarter} Policy Communication`}
            </h2>
            <p className="text-xs text-slate-400 font-editorial italic">
              Year {session.current_year}, Month {session.current_month} (Quarter {session.current_quarter}, Month {monthInQuarter})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* =========================================
              MONTH 1 & 2: GUIDANCE OR SILENCE
             ========================================= */}
          {!isMpcMonth && (
            <div className="space-y-5">
              <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                In Months 1 and 2 of the quarter, the Central Bank does not vote on interest rates. Instead, you can choose to <strong>say nothing</strong> (preserving optionality) or <strong>issue forward guidance</strong> to steer market expectations ahead of next month's decision.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Silence */}
                <div
                  onClick={() => setGuidanceChoice('silence')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    guidanceChoice === 'silence'
                      ? 'bg-slate-800 border-amber-400/80 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <span>Say Nothing</span>
                    </span>
                    {guidanceChoice === 'silence' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    No press release or guidance. Markets continue along current trend without central bank intervention.
                  </p>
                </div>

                {/* Hawkish Warning */}
                <div
                  onClick={() => setGuidanceChoice('hawkish')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    guidanceChoice === 'hawkish'
                      ? 'bg-rose-500/15 border-rose-500/80 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-rose-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-rose-400" />
                      <span>Hawkish Warning</span>
                    </span>
                    {guidanceChoice === 'hawkish' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Signal that inflation is too persistent. Tightens 2Y bond yields preemptively, cools stock speculation, and boosts currency.
                  </p>
                </div>

                {/* Dovish Reassurance */}
                <div
                  onClick={() => setGuidanceChoice('dovish')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    guidanceChoice === 'dovish'
                      ? 'bg-emerald-500/15 border-emerald-500/80 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <span>Dovish Reassurance</span>
                    </span>
                    {guidanceChoice === 'dovish' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Highlight emerging growth headwinds. Eases market conditions, lifts Doll Street equities, and lowers short yields.
                  </p>
                </div>

                {/* Neutral / Data-Dependent */}
                <div
                  onClick={() => setGuidanceChoice('neutral')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    guidanceChoice === 'neutral'
                      ? 'bg-amber-500/15 border-amber-500/80 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                      <Minus className="w-4 h-4 text-amber-400" />
                      <span>Data-Dependent Stance</span>
                    </span>
                    {guidanceChoice === 'neutral' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Reiterate strict adherence to upcoming CPI prints. Dampens market volatility without committing to a directional move.
                  </p>
                </div>

              </div>

              {guidanceChoice !== 'silence' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Governor's Keynote Statement (Optional Quote for Press)
                  </label>
                  <textarea
                    value={guidanceStatement}
                    onChange={(e) => setGuidanceStatement(e.target.value)}
                    rows={3}
                    placeholder="e.g. 'The Committee remains resolute in restoring price stability. We will not hesitate to act decisively at the upcoming quarterly review if inflation does not recede...'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-editorial focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* =========================================
              MONTH 3: MPC INTEREST RATE DECISION
             ========================================= */}
          {isMpcMonth && (
            <div className="space-y-6">
              
              {/* Benchmark Reference Banner */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs block">Current Policy Rate</span>
                  <span className="font-data text-xl font-bold text-slate-100">{currentRate.toFixed(2)}%</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 text-xs block">Taylor Rule Benchmark</span>
                  <span className="font-data text-xl font-bold text-amber-400">{taylorRule.toFixed(2)}%</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-xs block">Proposed New Rate</span>
                  <span className={`font-data text-xl font-bold ${rateDecisionBps > 0 ? 'text-rose-400' : (rateDecisionBps < 0 ? 'text-emerald-400' : 'text-slate-100')}`}>
                    {newRate.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Rate Move Options: -100 to +100 in quarter percents */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                  Select Policy Rate Adjustment (Quarter-Percent Increments)
                </label>

                {/* Flip-Flop Contradiction Warning */}
                {(() => {
                  const recent = session.economic_state.recent_guidance || [];
                  const hasDovish = recent.some(g => g.stance === 'dovish');
                  const hasHawkish = recent.some(g => g.stance === 'hawkish');
                  const isContradiction = (hasDovish && rateDecisionBps > 0) || (hasHawkish && rateDecisionBps < 0);

                  if (!isContradiction) return null;

                  return (
                    <div className="mb-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-300 font-semibold">Taper Tantrum Risk:</strong> You delivered {hasDovish ? 'Dovish' : 'Hawkish'} guidance earlier in this quarter. Enacting an opposing rate {rateDecisionBps > 0 ? 'hike' : 'cut'} will trigger a severe Credibility Shock, dislocating 2Y bond yields (+28 bps) and sparking a sharp equity selloff on Doll Street.
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: '-100 bps (-1.00%)', val: -100, color: 'text-emerald-400' },
                    { label: '-75 bps (-0.75%)', val: -75, color: 'text-emerald-400' },
                    { label: '-50 bps (-0.50%)', val: -50, color: 'text-emerald-400' },
                    { label: '-25 bps (-0.25%)', val: -25, color: 'text-emerald-400' },
                    { label: 'HOLD (0 bps)', val: 0, color: 'text-slate-200' },
                    { label: '+25 bps (+0.25%)', val: 25, color: 'text-rose-400' },
                    { label: '+50 bps (+0.50%)', val: 50, color: 'text-rose-400' },
                    { label: '+75 bps (+0.75%)', val: 75, color: 'text-rose-400' },
                    { label: '+100 bps (+1.00%)', val: 100, color: 'text-rose-400' }
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setRateDecisionBps(btn.val)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        rateDecisionBps === btn.val
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow-md'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-mono">{btn.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        New: {(currentRate + btn.val / 100).toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Economic Transmission Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 font-sans">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                  Projected Transmission Mechanism:
                </span>
                {rateDecisionBps > 0 && (
                  <p className="text-slate-300">
                    <strong className="text-rose-400">Rate Hike (+{rateDecisionBps} bps):</strong> Cools aggregate consumer borrowing and business CapEx; compresses P/E multiples on Doll Street; dampens inflation momentum; strengthens foreign exchange value; may moderately raise unemployment over 2-3 quarters.
                  </p>
                )}
                {rateDecisionBps < 0 && (
                  <p className="text-slate-300">
                    <strong className="text-emerald-400">Rate Cut ({rateDecisionBps} bps):</strong> Injects liquidity into commercial credit markets; stimulates housing purchases and construction; lifts equity prices on Doll Street; risks accelerating inflation if capacity is already constrained.
                  </p>
                )}
                {rateDecisionBps === 0 && (
                  <p className="text-slate-300">
                    <strong className="text-slate-200">Rate Pause (0 bps):</strong> Maintains existing monetary stance. Allows earlier policy impulses to work through the banking system while preserving policy runway for incoming data.
                  </p>
                )}
              </div>

              {/* Chairman Press Statement */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Governor's Post-Meeting Communique (Statement to Media)
                </label>
                <textarea
                  value={pressStatement}
                  onChange={(e) => setPressStatement(e.target.value)}
                  rows={3}
                  placeholder="e.g. 'In light of ongoing macroeconomic developments, the Committee has voted today to adjust our policy stance. Our dual mandate requires balancing price discipline with full employment...'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-editorial focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                />
              </div>

            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg ${
                isMpcMonth
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
              }`}
            >
              {loading ? 'Transmitting Policy Decision...' : (isMpcMonth ? 'Ratify MPC Vote & Enact Rate' : 'Deliver Monthly Communication')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
