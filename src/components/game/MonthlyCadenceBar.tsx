import React from 'react';
import { GameSession } from '../../types';
import { Calendar, AlertCircle, ArrowRight, BellRing, Vote } from 'lucide-react';

interface MonthlyCadenceBarProps {
  session: GameSession;
  onOpenActionModal: () => void;
  isHighlighted?: boolean;
}

export const MonthlyCadenceBar: React.FC<MonthlyCadenceBarProps> = ({ session, onOpenActionModal, isHighlighted }) => {
  const monthInQuarter = session.month_in_quarter; // 1, 2, or 3
  const isMpcMonth = monthInQuarter === 3;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Date & Tenure */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-prestige text-lg font-bold text-slate-100">
                Year {session.current_year}, Month {session.current_month}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                Quarter {session.current_quarter}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Total Tenure: {session.total_months_elapsed} months ({Math.floor(session.total_months_elapsed / 12)} years, {session.total_months_elapsed % 12} mos)
            </p>
          </div>
        </div>

        {/* Center: 3-Month Quarter Stepper */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
          
          {/* Month 1 */}
          <div className={`flex-1 rounded-xl p-2.5 border transition-all ${
            monthInQuarter === 1 
              ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-950/20' 
              : (monthInQuarter > 1 ? 'bg-slate-950/60 border-slate-800/80 opacity-70' : 'bg-slate-950/30 border-slate-800/40 opacity-40')
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold uppercase tracking-wider text-slate-300">Month 1</span>
              {monthInQuarter === 1 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
            </div>
            <div className="text-xs font-medium text-slate-200 truncate">
              Early Guidance
            </div>
          </div>

          <div className="text-slate-600">→</div>

          {/* Month 2 */}
          <div className={`flex-1 rounded-xl p-2.5 border transition-all ${
            monthInQuarter === 2 
              ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-950/20' 
              : (monthInQuarter > 2 ? 'bg-slate-950/60 border-slate-800/80 opacity-70' : 'bg-slate-950/30 border-slate-800/40 opacity-40')
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold uppercase tracking-wider text-slate-300">Month 2</span>
              {monthInQuarter === 2 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
            </div>
            <div className="text-xs font-medium text-slate-200 truncate">
              Pre-MPC Guidance
            </div>
          </div>

          <div className="text-slate-600">→</div>

          {/* Month 3: MPC Decision */}
          <div className={`flex-1 rounded-xl p-2.5 border transition-all ${
            monthInQuarter === 3 
              ? 'bg-rose-500/15 border-rose-500/60 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/50' 
              : 'bg-slate-950/40 border-slate-800/60'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                <Vote className="w-3 h-3 text-rose-400" />
                <span>Month 3</span>
              </span>
              {monthInQuarter === 3 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>}
            </div>
            <div className="text-xs font-bold text-rose-200 truncate">
              Rate Vote Meeting
            </div>
          </div>

        </div>

        {/* Right: Action Button & Mobile Finger Scroll Safe Gutter */}
        <div 
          id="mobile-guidance-scroll-zone"
          className={`relative transition-all duration-300 rounded-2xl p-4 sm:p-0 my-2 sm:my-0 ${
            isHighlighted
              ? 'ring-4 ring-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.5)] bg-amber-500/15 border border-amber-400 animate-pulse'
              : 'bg-slate-950/60 sm:bg-transparent border border-slate-800/80 sm:border-transparent'
          }`}
        >
          {/* Mobile Finger Touch & Scroll Helper Header */}
          <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-300 mb-2 px-1 font-medium">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wide">
              <span>👆</span>
              <span>Finger Touch & Scroll Zone</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Swipe here to scroll
            </span>
          </div>

          {session.status === 'active' ? (
            <button
              onClick={onOpenActionModal}
              className={`w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer ${
                isMpcMonth
                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-950/50 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-950/40'
              }`}
            >
              {isMpcMonth ? (
                <>
                  <Vote className="w-4 h-4" />
                  <span>Convene MPC Rate Vote</span>
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4" />
                  <span>Issue Guidance or Silence</span>
                </>
              )}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="px-5 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold uppercase tracking-wider text-center">
              Mandate Concluded ({session.status === 'dismissed' ? 'Dismissed' : 'Completed'})
            </div>
          )}

          {/* Mobile Finger Touch & Scroll Helper Footer */}
          <div className="sm:hidden flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-2 font-medium">
            <span className="text-slate-500">↕️</span>
            <span>Use this safe padding area to scroll without triggering cards</span>
          </div>
        </div>

      </div>
    </div>
  );
};
