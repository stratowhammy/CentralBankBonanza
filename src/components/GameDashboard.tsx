import React, { useState } from 'react';
import { GameSession, ActionType } from '../types';
import { MonthlyCadenceBar } from './game/MonthlyCadenceBar';
import { IndicatorsGrid } from './game/IndicatorsGrid';
import { YieldCurveChart } from './game/YieldCurveChart';
import { EconomicTrendsChart } from './game/EconomicTrendsChart';
import { NewspaperDesk } from './game/NewspaperDesk';
import { MonthlyActionModal } from './game/MonthlyActionModal';
import { AdvisorDrawer } from './game/AdvisorDrawer';
import { GodModeChairTracker } from './game/GodModeChairTracker';
import { MessageSquare, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface GameDashboardProps {
  session: GameSession;
  onSubmitAction: (params: {
    action_type: ActionType;
    action_value?: string;
    statement?: string;
  }) => Promise<void>;
  onSwitchChair: (nextChairId: string) => Promise<void>;
  onRefreshSession: () => Promise<void>;
}

export const GameDashboard: React.FC<GameDashboardProps> = ({
  session,
  onSubmitAction,
  onSwitchChair,
  onRefreshSession
}) => {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAdvisorDrawerOpen, setIsAdvisorDrawerOpen] = useState(false);

  const handleStateUpdated = (newState: any) => {
    onRefreshSession();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Dismissal / Term Over banner if game is not active */}
        {session.status === 'dismissed' && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 shadow-2xl flex items-center justify-between text-rose-200">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              <div>
                <h3 className="font-prestige font-bold text-base text-rose-100">
                  Parliamentary Vote of No Confidence: Dismissed From Office
                </h3>
                <p className="text-xs text-rose-300 mt-0.5">
                  Due to prolonged negative public sentiment, high inflation, or parliamentary opposition, the Select Committee has stripped your mandate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Monthly Turn Cadence Bar */}
        <MonthlyCadenceBar
          session={session}
          onOpenActionModal={() => setIsActionModalOpen(true)}
        />

        {/* 2. God Mode Chair Succession Bar (if God Mode) */}
        {session.play_mode === 'god_mode' && (
          <GodModeChairTracker
            session={session}
            onSwitchChair={onSwitchChair}
          />
        )}

        {/* 3. Primary & Secondary Economic Indicators */}
        <IndicatorsGrid session={session} />

        {/* 4. Financial Charts: Yield Curve & Historical Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <YieldCurveChart
            policyRate={session.economic_state.interest_rate}
            yield2Y={session.economic_state.bond_yield_2y}
            yield10Y={session.economic_state.bond_yield_10y}
          />
          <EconomicTrendsChart history={session.history || []} />
        </div>

        {/* 5. The Monthly Newspaper Desk */}
        <NewspaperDesk
          articles={session.news_articles || []}
          currentYear={session.current_year}
          currentMonth={session.current_month}
        />

      </div>

      {/* Floating Action Button for Chief of Staff / Economic Advisor */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAdvisorDrawerOpen(true)}
          className="px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-2xl shadow-indigo-950/80 border border-indigo-400/40 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <span>Chief of Staff & Counsel</span>
        </button>
      </div>

      {/* Monthly Action Modal (Guidance or MPC Rate Decision) */}
      <MonthlyActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        session={session}
        onSubmitAction={onSubmitAction}
      />

      {/* Embedded Economic Advisor Drawer */}
      <AdvisorDrawer
        isOpen={isAdvisorDrawerOpen}
        onClose={() => setIsAdvisorDrawerOpen(false)}
        session={session}
        onStateUpdated={handleStateUpdated}
      />
    </div>
  );
};
