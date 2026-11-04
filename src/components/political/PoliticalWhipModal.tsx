import React, { useState } from 'react';
import { PoliticalBill, PoliticalSession, WhipCountResult } from '../../types';
import { api } from '../../api';
import { X, Vote, CheckCircle2, AlertTriangle, Sparkles, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: PoliticalBill;
  session: PoliticalSession;
  onFloorVoteSuccess: (passed: boolean, message: string) => void;
}

export const PoliticalWhipModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bill,
  session,
  onFloorVoteSuccess
}) => {
  const [capitalToSpend, setCapitalToSpend] = useState(0);
  const [whipResult, setWhipResult] = useState<WhipCountResult | null>(() => {
    if (bill.whip_count) {
      try {
        return JSON.parse(bill.whip_count);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isWhipping, setIsWhipping] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  if (!isOpen) return null;

  const currentCapital = session.political_state.political_capital || 0;

  const handleCalculateWhip = async (spend = capitalToSpend) => {
    setIsWhipping(true);
    try {
      const res = await api.getWhipCount(session.id, bill.id, spend);
      setWhipResult(res.whip);
    } catch (err: any) {
      alert(err.message || 'Failed to calculate whip count');
    } finally {
      setIsWhipping(false);
    }
  };

  const handleConductFloorVote = async () => {
    if (!confirm(`Are you ready to call the division and hold a formal floor vote on '${bill.title}'?`)) {
      return;
    }
    setIsVoting(true);
    try {
      const res = await api.floorVoteBill(session.id, bill.id, capitalToSpend);
      onFloorVoteSuccess(res.passed, res.message);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Floor vote failed');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm font-sans animate-fade-in">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-600/40 flex items-center justify-center text-cyan-400">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 font-serif">Chamber Whip Board & Floor Tally</h3>
              <p className="text-xs text-stone-400">{bill.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Bill Summary Strip */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-400">Appropriation / Fiscal Score: </span>
              <span className="font-mono font-bold text-amber-300">
                {bill.fiscal_impact_billions > 0 ? `+$${bill.fiscal_impact_billions}B` : `-$${Math.abs(bill.fiscal_impact_billions)}B`}
              </span>
            </div>
            <div>
              <span className="text-stone-400">Public Support: </span>
              <span className="font-bold text-emerald-400">{bill.public_support || 60}% favorable</span>
            </div>
            <div>
              <span className="text-stone-400">Status: </span>
              <span className="font-bold uppercase text-cyan-300">{bill.status.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Whip Vote Count Board */}
          {whipResult ? (
            <div className="space-y-4">
              
              {/* Primary Gauge */}
              <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 text-center">
                <div className="flex items-center justify-around mb-4">
                  <div>
                    <div className="text-3xl font-bold font-mono text-emerald-400">{whipResult.total_ayes}</div>
                    <div className="text-xs uppercase tracking-wider text-emerald-500 font-bold">Projected Ayes</div>
                  </div>
                  <div className="text-stone-600 font-mono text-xl">vs</div>
                  <div>
                    <div className="text-3xl font-bold font-mono text-red-400">{whipResult.total_nays}</div>
                    <div className="text-xs uppercase tracking-wider text-red-500 font-bold">Projected Nays</div>
                  </div>
                </div>

                {/* Progress Bar with Majority Line */}
                <div className="relative w-full h-4 bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (whipResult.total_ayes / whipResult.total_seats) * 100)}%` }}
                  />
                  {/* Majority threshold pin */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-glow"
                    style={{ left: `${(whipResult.majority_threshold / whipResult.total_seats) * 100}%` }}
                    title={`Majority Threshold: ${whipResult.majority_threshold}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 font-mono">
                  <span>0 Seats</span>
                  <span className="text-amber-400 font-bold">Majority Needed: {whipResult.majority_threshold}</span>
                  <span>{whipResult.total_seats} Total Seats</span>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300">
                  {whipResult.whip_assessment}
                </div>
              </div>

              {/* Faction Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="font-bold text-amber-300 mb-1">Ruling Party Coalition</div>
                  <div className="text-stone-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Party Ayes:</span>
                      <span className="font-mono text-emerald-400">{whipResult.breakdown.party_ayes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Party Nays:</span>
                      <span className="font-mono text-red-400">{whipResult.breakdown.party_nays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Undecided:</span>
                      <span className="font-mono text-amber-400">{whipResult.breakdown.party_undecided}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="font-bold text-cyan-300 mb-1">Opposition Bipartisan Cross</div>
                  <div className="text-stone-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Opposition Ayes:</span>
                      <span className="font-mono text-emerald-400">{whipResult.breakdown.opposition_ayes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Opposition Nays:</span>
                      <span className="font-mono text-red-400">{whipResult.breakdown.opposition_nays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cross-Aisle Ratio:</span>
                      <span className="font-mono text-stone-300">
                        {Math.round((whipResult.breakdown.opposition_ayes / (whipResult.total_seats - 350)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-8">
              <button
                onClick={() => handleCalculateWhip(0)}
                disabled={isWhipping}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs uppercase rounded-xl transition-all shadow-lg flex items-center space-x-2 mx-auto"
              >
                <Vote className="w-4 h-4" />
                <span>{isWhipping ? 'Polling Party Wings...' : 'Run Floor Whip Calculation'}</span>
              </button>
            </div>
          )}

          {/* Whip Leverage: Spend Political Capital */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-stone-200">Whip Leverage: Arm-Twist Swing Votes</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">
                Available Capital: {currentCapital} pts
              </span>
            </div>

            <p className="text-xs text-stone-400 leading-normal">
              Spend your political capital on district earmarks, committee concessions, or leadership favors to flip undecided and rebel votes.
            </p>

            <div className="flex items-center space-x-3">
              {[0, 5, 10, 15, 20].map(pts => (
                <button
                  key={pts}
                  type="button"
                  disabled={pts > currentCapital}
                  onClick={() => {
                    setCapitalToSpend(pts);
                    handleCalculateWhip(pts);
                  }}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    capitalToSpend === pts
                      ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500'
                      : pts > currentCapital
                      ? 'border-stone-800 bg-stone-900 text-stone-600 cursor-not-allowed'
                      : 'border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  +{pts} Pts
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-stone-200 uppercase"
          >
            Cancel
          </button>

          <button
            onClick={handleConductFloorVote}
            disabled={isVoting || !whipResult}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isVoting ? 'Conducting Roll-Call Division...' : 'Call Floor Division & Vote'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
