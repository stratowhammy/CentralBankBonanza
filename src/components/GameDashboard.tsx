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
import { DotPlotChart } from './game/DotPlotChart';
import { BalanceSheetControl } from './game/BalanceSheetControl';
import { MpcVotingDivisionModal } from './game/MpcVotingDivisionModal';
import { ParliamentaryHearingModal } from './game/ParliamentaryHearingModal';
import { ParliamentHearingReminderModal } from './game/ParliamentHearingReminderModal';
import { TermReappointmentModal } from './game/TermReappointmentModal';
import { VariableGraphOverlay } from './game/VariableGraphOverlay';
import { MobileScrollTutorialOverlay } from './game/MobileScrollTutorialOverlay';
import { api } from '../api';
import { MessageSquare, ShieldAlert, Landmark, Award, BarChart2, ArrowLeft, LineChart, Vote, BellRing } from 'lucide-react';

interface GameDashboardProps {
  session: GameSession;
  onSubmitAction: (params: {
    action_type: ActionType;
    action_value?: string;
    statement?: string;
  }) => Promise<void>;
  onSwitchChair: (nextChairId: string) => Promise<void>;
  onRefreshSession: () => Promise<void>;
  onExit?: () => void;
}

export const GameDashboard: React.FC<GameDashboardProps> = ({
  session,
  onSubmitAction,
  onSwitchChair,
  onRefreshSession,
  onExit
}) => {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAdvisorDrawerOpen, setIsAdvisorDrawerOpen] = useState(false);
  const [isDotPlotOpen, setIsDotPlotOpen] = useState(false);
  const [isBalanceSheetOpen, setIsBalanceSheetOpen] = useState(false);
  const [isMpcVoteOpen, setIsMpcVoteOpen] = useState(false);
  const [isHearingOpen, setIsHearingOpen] = useState(false);
  const [isHearingReminderOpen, setIsHearingReminderOpen] = useState(false);
  const [isTermReviewOpen, setIsTermReviewOpen] = useState(false);
  const [isGraphOverlayOpen, setIsGraphOverlayOpen] = useState(false);
  const [activeTrackedVar, setActiveTrackedVar] = useState<string | undefined>(undefined);
  const [showMobileScrollGuide, setShowMobileScrollGuide] = useState(false);

  // Auto-show mobile scroll tutorial overlay when entering the simulation on mobile viewports
  React.useEffect(() => {
    const isMobile = window.innerWidth < 768;
    try {
      const hasSeen = localStorage.getItem('cbb_mobile_scroll_guide_seen');
      if (isMobile && !hasSeen) {
        setShowMobileScrollGuide(true);
      }
    } catch (e) {}
  }, [session.id]);

  const isHearingDue = session.status === 'active' && 
    Boolean(session.hearing_eligible) &&
    session.economic_state.last_hearing_completed_month !== session.total_months_elapsed &&
    session.economic_state.last_hearing_skipped_month !== session.total_months_elapsed;

  const handleOpenAction = () => {
    if (isHearingDue) {
      setIsHearingReminderOpen(true);
      return;
    }
    setIsActionModalOpen(true);
  };

  // Listen for mobile navigation events dispatched from Android Bottom Nav
  React.useEffect(() => {
    const handleOpenAdvisor = () => setIsAdvisorDrawerOpen(true);
    const handleOpenTracker = () => setIsGraphOverlayOpen(true);

    window.addEventListener('cbb:open-advisor', handleOpenAdvisor);
    window.addEventListener('cbb:open-tracker', handleOpenTracker);
    window.addEventListener('cbb:open-action', handleOpenAction);

    return () => {
      window.removeEventListener('cbb:open-advisor', handleOpenAdvisor);
      window.removeEventListener('cbb:open-tracker', handleOpenTracker);
      window.removeEventListener('cbb:open-action', handleOpenAction);
    };
  }, [isHearingDue]);

  const handleStateUpdated = () => {
    onRefreshSession();
  };

  const handleUpdateBalanceSheet = async (params: { qt_monthly_pace?: number; discount_window_active?: boolean }) => {
    await api.updateBalanceSheet(session.id, params);
    await onRefreshSession();
  };

  const handleTestimonyComplete = async () => {
    await onRefreshSession();
  };

  const handleDeclineHearing = async () => {
    await api.declineParliamentHearing(session.id);
    await onRefreshSession();
  };

  const handleReappointed = async () => {
    await onRefreshSession();
  };

  const isTermReviewDue = session.term_review_eligible || ((session.economic_state.term_months_completed ?? 0) >= 48);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 md:pb-24 android-scroll-bottom-clearance">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {onExit && (
              <button
                onClick={onExit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit to My Simulations</span>
              </button>
            )}
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">{session.chair_name}</span>
              <span className="text-slate-500 mx-1.5">•</span>
              <span className="capitalize text-slate-300">{session.play_mode === 'first_person' ? 'First Person' : 'God Mode'}</span>
              <span className="text-slate-500 mx-1.5">•</span>
              <span className="capitalize text-amber-400 font-medium">{session.difficulty} Scenario</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-mono">
              Year {session.current_year}, Month {session.current_month}
            </span>
            <span className="text-slate-600">•</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              session.status === 'active' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : session.status === 'dismissed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {session.status === 'active' ? '● In Office' : session.status.toUpperCase()}
            </span>
          </div>
        </div>

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

        {/* Parliamentary Question Time Summons Banner (Pillar D) */}
        {isHearingDue && session.status === 'active' && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Landmark className="w-5 h-5 text-amber-400" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                    Statutory Summons
                  </span>
                  <h3 className="font-serif font-bold text-sm text-amber-100">
                    Parliamentary Treasury Select Committee Question Time
                  </h3>
                </div>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Lawmakers have convened a formal oversight hearing to examine your interest rate policy, mortgage pain, and living standards.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsHearingOpen(true)}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-amber-950/60 flex-shrink-0 cursor-pointer"
            >
              Testify Before Parliament 🏛
            </button>
          </div>
        )}

        {/* 4-Year Term Milestone Banner (Pillar D) */}
        {isTermReviewDue && session.status === 'active' && (
          <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-indigo-200">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Award className="w-5 h-5 text-indigo-400" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                    Term Milestone
                  </span>
                  <h3 className="font-serif font-bold text-sm text-indigo-100">
                    Quadrennial Mandate Review: 48 Months of Governance Completed
                  </h3>
                </div>
                <p className="text-xs text-indigo-300/80 mt-0.5">
                  The Prime Minister and Parliamentary Council have completed your 4-year cumulative stewardship scorecard.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTermReviewOpen(true)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-indigo-950/60 flex-shrink-0 cursor-pointer"
            >
              Review Reappointment Scorecard 🎖
            </button>
          </div>
        )}

        {/* 1. Monthly Turn Cadence Bar */}
        <MonthlyCadenceBar
          session={session}
          onOpenActionModal={handleOpenAction}
          isHighlighted={showMobileScrollGuide}
        />

        {/* 2. God Mode Chair Succession Bar (if God Mode) */}
        {session.play_mode === 'god_mode' && (
          <GodModeChairTracker
            session={session}
            onSwitchChair={onSwitchChair}
          />
        )}

        {/* Quick Institutional Tools Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-xs text-slate-400 font-medium">
            Institutional Facilities & Monetary Governance Desk:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsGraphOverlayOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isGraphOverlayOpen
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50'
                  : 'bg-slate-900 border-slate-700 hover:border-amber-400 text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-amber-400" />
              <span>Variable Graph Overlay</span>
              {isGraphOverlayOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-0.5" />
              )}
            </button>
            <button
              onClick={() => setIsDotPlotOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-500 text-purple-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>☵</span> FOMC Dot-Plot
            </button>
            <button
              onClick={() => setIsBalanceSheetOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🏛</span> Balance Sheet & QT
            </button>
            {session.economic_state.last_mpc_vote && (
              <button
                onClick={() => setIsMpcVoteOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>⚖</span> MPC Division ({session.economic_state.last_mpc_vote.tally_label})
              </button>
            )}
            <button
              onClick={() => setIsHearingOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🏛</span> Parliament Select Committee
            </button>
            {/* Mobile Touch & Scroll Guide Button */}
            <button
              onClick={() => setShowMobileScrollGuide(true)}
              className="md:hidden px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Mobile Scrolling Guide"
            >
              <span>📱</span> Scroll Guide
            </button>
          </div>
        </div>

        {/* 3. Primary & Secondary Economic Indicators */}
        <IndicatorsGrid 
          session={session}
          onOpenDotPlot={() => setIsDotPlotOpen(true)}
          onOpenBalanceSheet={() => setIsBalanceSheetOpen(true)}
          onOpenMpcVote={() => setIsMpcVoteOpen(true)}
          onTrackVariable={(varId) => {
            setActiveTrackedVar(varId);
            setIsGraphOverlayOpen(true);
          }}
        />

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

      {/* Floating Action Button for Chief of Staff / Economic Advisor (bottom-right) */}
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

      {/* Floating Action Button for Movable Variable Graph Overlay (bottom-left) */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsGraphOverlayOpen(prev => !prev)}
          className={`px-4 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xl border flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${
            isGraphOverlayOpen
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/60 shadow-amber-950/80 font-extrabold'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-amber-400 shadow-slate-950/80'
          }`}
          title="Open Movable Variable Graph Overlay"
        >
          <LineChart className={`w-4 h-4 ${isGraphOverlayOpen ? 'text-slate-950' : 'text-amber-400'}`} />
          <span>Graph Tracker</span>
          {isGraphOverlayOpen && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        </button>
      </div>

      {/* Movable Variable Graph Overlay Component */}
      <VariableGraphOverlay
        session={session}
        isOpen={isGraphOverlayOpen}
        onClose={() => setIsGraphOverlayOpen(false)}
        initialVariableId={activeTrackedVar}
      />

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

      {/* Dot-Plot Chart Modal (Pillar E) */}
      <DotPlotChart
        isOpen={isDotPlotOpen}
        onClose={() => setIsDotPlotOpen(false)}
        dotPlotData={session.dot_plot}
      />

      {/* Balance Sheet & QT Operations Modal (Pillar E) */}
      <BalanceSheetControl
        isOpen={isBalanceSheetOpen}
        onClose={() => setIsBalanceSheetOpen(false)}
        economicState={session.economic_state}
        onUpdate={handleUpdateBalanceSheet}
      />

      {/* MPC Board Voting Division Modal (Pillar B) */}
      <MpcVotingDivisionModal
        isOpen={isMpcVoteOpen}
        onClose={() => setIsMpcVoteOpen(false)}
        votingResult={session.economic_state.last_mpc_vote}
      />

      {/* Parliamentary Question Time Hearing Modal (Pillar D) */}
      <ParliamentaryHearingModal
        sessionId={session.id}
        isOpen={isHearingOpen}
        onClose={() => setIsHearingOpen(false)}
        onTestimonyComplete={handleTestimonyComplete}
      />

      {/* Parliamentary Hearing Attendance Required Popup Reminder */}
      <ParliamentHearingReminderModal
        isOpen={isHearingReminderOpen}
        onClose={() => setIsHearingReminderOpen(false)}
        onAttend={() => {
          setIsHearingReminderOpen(false);
          setIsHearingOpen(true);
        }}
        onDecline={handleDeclineHearing}
        currentMonth={session.current_month}
        currentYear={session.current_year}
      />

      {/* 4-Year Term Reappointment Modal (Pillar D) */}
      <TermReappointmentModal
        sessionId={session.id}
        isOpen={isTermReviewOpen}
        onClose={() => setIsTermReviewOpen(false)}
        onReappointed={handleReappointed}
      />

      {/* Mobile Android Floating Action Button (FAB) */}
      {session.status === 'active' && (
        <button
          onClick={handleOpenAction}
          className="android-extended-fab md:hidden"
          aria-label="Execute Monetary Policy Decision"
        >
          {session.month_in_quarter === 3 ? (
            <>
              <Vote className="w-5 h-5 text-slate-950" />
              <span>VOTE MPC RATE</span>
            </>
          ) : (
            <>
              <BellRing className="w-5 h-5 text-slate-950" />
              <span>ISSUE GUIDANCE</span>
            </>
          )}
        </button>
      )}

      {/* Mobile Scroll Tutorial Overlay */}
      <MobileScrollTutorialOverlay
        isOpen={showMobileScrollGuide}
        onClose={() => setShowMobileScrollGuide(false)}
      />
    </div>
  );
};
