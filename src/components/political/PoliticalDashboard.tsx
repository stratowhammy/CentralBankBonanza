import React, { useState } from 'react';
import { PoliticalSession, PoliticalBill, PoliticalEventChoice, User } from '../../types';
import { api } from '../../api';
import { 
  Landmark, Award, Scale, Users, TrendingUp, TrendingDown, 
  FileText, Vote, Sparkles, Building2, Calendar, Shield, 
  DollarSign, ArrowRight, CheckCircle2, AlertTriangle, Plus,
  Megaphone, MessageSquare, Briefcase, Star, Clock, FolderOpen,
  UserCircle, LogOut, Handshake
} from 'lucide-react';
import { PoliticalAdvisorDrawer } from './PoliticalAdvisorDrawer';
import { PoliticalBillModal } from './PoliticalBillModal';
import { PoliticalWhipModal } from './PoliticalWhipModal';
import { PoliticalEventModal } from './PoliticalEventModal';
import { PoliticalElectionModal } from './PoliticalElectionModal';
import { PoliticalEventWebModal } from './PoliticalEventWebModal';
import { PoliticalCampaignModal } from './PoliticalCampaignModal';
import { PoliticalCaucusModal } from './PoliticalCaucusModal';
import { AudioPlayButton } from '../AudioPlayButton';

interface Props {
  session: PoliticalSession;
  user?: User | null;
  onRefreshSession: () => void;
  onSwitchToCbs: () => void;
  onNewCareer: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const PoliticalDashboard: React.FC<Props> = ({
  session,
  user,
  onRefreshSession,
  onSwitchToCbs,
  onNewCareer,
  onOpenAuth,
  onLogout
}) => {
  const pState = session.political_state;
  const eState = session.economic_state;

  // Modals state
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedBillForModal, setSelectedBillForModal] = useState<PoliticalBill | null>(null);
  const [isWhipModalOpen, setIsWhipModalOpen] = useState(false);
  const [selectedBillForWhip, setSelectedBillForWhip] = useState<PoliticalBill | null>(null);
  const [isEventWebOpen, setIsEventWebOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isCaucusModalOpen, setIsCaucusModalOpen] = useState(false);
  
  // Active event & election results
  const [activeEvent, setActiveEvent] = useState<any | null>(() => {
    return (session.active_events && session.active_events.length > 0) ? session.active_events[0] : null;
  });
  const [electionResult, setElectionResult] = useState<any | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Execute primary monthly action
  const handlePrimaryAction = async (actionType: string, actionDetails: string) => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      const res = await api.submitPoliticalAction(session.id, {
        action_type: actionType,
        action_details: actionDetails
      });
      if (res.election_result) {
        setElectionResult(res.election_result);
      }
      if (res.triggered_event) {
        setActiveEvent(res.triggered_event);
      }
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to advance turn');
    } finally {
      setIsAdvancing(false);
    }
  };

  // Resolve an active event choice
  const handleResolveEventChoice = async (choice: PoliticalEventChoice) => {
    setIsAdvancing(true);
    try {
      const res = await api.submitPoliticalAction(session.id, {
        action_type: 'event_response',
        action_details: `Executed choice ${choice.option_id}: ${choice.label}`,
        event_choice: choice
      });
      setActiveEvent(null);
      if (res.election_result) {
        setElectionResult(res.election_result);
      }
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve event');
    } finally {
      setIsAdvancing(false);
    }
  };

  // Promote Politician to Next Office
  const handlePromote = async () => {
    if (!confirm(`Are you ready to accept promotion and ascend to higher office?`)) return;
    try {
      const res = await api.promotePolitician(session.id);
      alert(`🎉 ELEVATION CEREMONY COMPLETE! You have officially assumed the office of ${res.new_office}.`);
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Promotion failed');
    }
  };

  // Career stages progression definition
  const stages = session.system_type === 'parliamentary'
    ? [
        { id: 'backbencher', label: 'Backbench MP' },
        { id: 'committee_chair', label: 'Committee Chair' },
        { id: 'cabinet_minister', label: 'Cabinet Minister' },
        { id: 'prime_minister', label: 'Prime Minister' }
      ]
    : [
        { id: 'representative', label: 'US Representative' },
        { id: 'committee_chair', label: 'Committee Chair' },
        { id: 'senator', label: 'US Senator' },
        { id: 'president', label: 'President of the US' }
      ];

  const currentStageIndex = stages.findIndex(s => s.id === pState.current_stage_id);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-900 selection:text-amber-100">
      
      {/* Executive Chamber Header */}
      <header className="border-b border-stone-800 bg-stone-900/95 backdrop-blur px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-stone-100 font-serif leading-none">
                {pState.politician_title} {pState.politician_name}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-700/50 text-amber-300">
                {pState.party_name}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              {pState.chamber} • Constituency: <span className="text-stone-200 font-medium">{pState.district_name}</span>
            </p>
          </div>
        </div>

        {/* Telemetry Chips & Switcher */}
        <div className="flex items-center flex-wrap gap-3 w-full md:w-auto justify-end text-xs">
          
          <div className="px-3.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono text-stone-300">Year {session.current_year}, Month {session.current_month}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center space-x-2 text-red-300">
            <Vote className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono font-bold">
              {pState.months_to_election === 0 ? 'ELECTION DAY!' : `Election in ${pState.months_to_election} mos`}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center space-x-2 text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold">{pState.political_capital} Capital Pts</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center space-x-2 text-emerald-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-bold">${pState.war_chest_millions}M War Chest</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center space-x-1.5 text-amber-300">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="font-mono font-bold">{pState.aggregate_achievement_score || 0} Bill Pts</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center space-x-1.5 text-stone-300">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono">{pState.terms_in_office || 1} Term(s)</span>
          </div>

          <button
            onClick={() => setIsCampaignModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl border font-bold uppercase text-[11px] transition-all flex items-center space-x-1.5 shadow-md cursor-pointer ${
              pState.declared_campaign 
                ? (pState.declared_campaign.completed 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 border-emerald-400 ring-2 ring-emerald-400/40'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-400 ring-2 ring-amber-400/40 animate-pulse')
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 border-amber-400/60'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            <span>
              {pState.declared_campaign 
                ? (pState.declared_campaign.completed 
                    ? `Ballot Ready: ${pState.declared_campaign.target_title}` 
                    : `Donor Gauntlet (${pState.declared_campaign.questions_answered}/${pState.declared_campaign.questions_total})`) 
                : 'Run for Higher Office'}
            </span>
          </button>

          {/* Exit Career / Return to Careers Hub */}
          <button
            onClick={onNewCareer}
            className="px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 font-bold uppercase text-[11px] transition-colors flex items-center space-x-1.5 shadow-sm"
            title="Exit this simulation and return to the Careers Hub"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Exit Career</span>
          </button>

          {/* User Auth Profile / Sign In */}
          {user && user.username !== 'guest' ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-stone-950 border border-stone-800 text-xs">
              <div className="w-5 h-5 rounded-full bg-amber-950 border border-amber-600/50 flex items-center justify-center font-bold text-amber-400 text-[10px]">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-stone-300 font-medium max-w-[90px] truncate">{user.display_name}</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 text-stone-500 hover:text-stone-300 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase text-[11px] transition-colors flex items-center space-x-1 shadow-sm"
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )
          )}

          <button
            onClick={onSwitchToCbs}
            className="px-3.5 py-1.5 rounded-xl border border-amber-600/40 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold uppercase text-[11px] transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <span>Central Bank Sim (~/cbs)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        
        {/* Career Progression Bar */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                Executive & Parliamentary Career Ladder
              </div>
              <h2 className="text-base font-bold text-stone-100 font-serif">
                Constitutional Advancement Pathway
              </h2>
            </div>

            {pState.promotion_available && (
              <button
                onClick={handlePromote}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-lg animate-pulse flex items-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>Ascend to Higher Office</span>
              </button>
            )}
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stages.map((st, idx) => {
              const isCurrent = idx === currentStageIndex;
              const isCompleted = idx < currentStageIndex;
              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs ${
                    isCurrent
                      ? 'border-amber-500 bg-amber-950/20 text-stone-100 ring-1 ring-amber-500'
                      : isCompleted
                      ? 'border-emerald-800/40 bg-emerald-950/10 text-emerald-300'
                      : 'border-stone-800 bg-stone-950/40 text-stone-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold">Stage 0{idx + 1}</span>
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                  </div>
                  <div className="font-bold text-sm text-stone-200">{st.label}</div>
                  <div className="text-[10px] text-stone-400 mt-1 font-sans">
                    {isCompleted ? 'Mandate Completed' : isCurrent ? 'Active Office' : 'Requires Promotion'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dual Telemetry Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Political & Electoral Telemetry */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Vote className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-stone-100 font-serif">Political & Electoral Indicators</h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                  Voter Mood
                </span>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-4">
                {/* District Approval */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-400 font-sans">District Approval ({pState.district_name})</span>
                    <span className="font-mono font-bold text-emerald-400">{pState.district_approval}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pState.district_approval}%` }}
                    />
                  </div>
                </div>

                {/* National Favorability */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-400 font-sans">National Public Approval</span>
                    <span className="font-mono font-bold text-cyan-400">{pState.national_approval}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pState.national_approval}%` }}
                    />
                  </div>
                </div>

                {/* Party Whip Loyalty */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-400 font-sans">Party Whip Loyalty & Standing</span>
                    <span className="font-mono font-bold text-amber-400">{pState.party_loyalty}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pState.party_loyalty}%` }}
                    />
                  </div>
                </div>

                {/* Polling Margin & Ethics Scrutiny */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                    <span className="text-[11px] text-stone-400 block mb-1">Re-Election Polling Margin</span>
                    <span className={`text-xl font-bold font-mono ${pState.polling_margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pState.polling_margin > 0 ? `+${pState.polling_margin}%` : `${pState.polling_margin}%`}
                    </span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">vs prospective challenger</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                    <span className="text-[11px] text-stone-400 block mb-1">Ethics & Scandal Scrutiny</span>
                    <span className={`text-xl font-bold font-mono ${pState.ethics_scrutiny > 40 ? 'text-red-400' : 'text-stone-300'}`}>
                      {pState.ethics_scrutiny}%
                    </span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">investigative risk rating</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
              <span>Seniority & Tenure: {pState.terms_in_office || 1} term(s) ({pState.legislative_seniority} yrs)</span>
              <span>Bills Passed: {pState.bills_passed} (Achievement: <strong className="text-amber-400 font-mono">{pState.aggregate_achievement_score || 0} pts</strong>)</span>
            </div>
          </section>

          {/* Card 2: Shared Macroeconomic Backdrop (The Economic Engine) */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-stone-100 font-serif">Macroeconomic Backdrop</h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  Shared CBS Engine
                </span>
              </div>

              {/* Economic Indicators Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 block mb-1">Inflation (CPI)</span>
                  <span className={`text-xl font-bold font-mono ${eState.inflation_cpi > 4.0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {eState.inflation_cpi}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    {eState.inflation_cpi > 4.0 ? 'Voter grocery anger' : 'Stable prices'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 block mb-1">Unemployment</span>
                  <span className={`text-xl font-bold font-mono ${eState.unemployment_rate > 5.0 ? 'text-red-400' : 'text-stone-200'}`}>
                    {eState.unemployment_rate}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">Labor market health</span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 block mb-1">GDP Growth</span>
                  <span className={`text-xl font-bold font-mono ${eState.gdp_growth > 2.0 ? 'text-emerald-400' : eState.gdp_growth < 0.5 ? 'text-red-400' : 'text-stone-200'}`}>
                    {eState.gdp_growth}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">Economic expansion</span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 block mb-1">Central Bank Rate</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {eState.interest_rate}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">Borrowing & mortgage cost</span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 block mb-1">Fiscal Deficit</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {eState.fiscal_deficit}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">of GDP (Fiscal hawks)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[11px] text-stone-400 block mb-1">Debt-to-GDP</span>
                  <span className="text-xl font-bold font-mono text-stone-200">
                    {eState.debt_to_gdp}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">National borrowing pool</span>
                </div>

              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
              <span>Consumer Confidence: {eState.consumer_confidence || 75} pts</span>
              <span>
                {session.linked_cbs_session_id 
                  ? `🔗 Synced to CBS Session: ${session.linked_cbs_session_id}` 
                  : 'Standalone Macro Simulator'}
              </span>
            </div>
          </section>

        </div>

        {/* Monthly Primary Action Bar */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-stone-100 font-serif uppercase tracking-wider">
                Monthly Executive & Legislative Actions
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-sans">
              Choose your primary focus for Month {session.current_month}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            <button
              onClick={() => handlePrimaryAction('constituent_townhall', 'Held constituent townhall')}
              disabled={isAdvancing}
              className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 text-left transition-all hover:border-amber-600/50 group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-700/40 text-amber-400 flex items-center justify-center mb-2">
                <Users className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-stone-200 group-hover:text-amber-300">Constituent Townhall</div>
              <div className="text-[10px] text-stone-400 mt-0.5">+3.5% District App</div>
            </button>

            <button
              onClick={() => handlePrimaryAction('campaign_fundraiser', 'Hosted high-dollar PAC fundraiser')}
              disabled={isAdvancing}
              className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 text-left transition-all hover:border-emerald-600/50 group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 flex items-center justify-center mb-2">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-stone-200 group-hover:text-emerald-300">PAC Fundraiser</div>
              <div className="text-[10px] text-stone-400 mt-0.5">+$1.5M - $4M War Chest</div>
            </button>

            <button
              onClick={() => handlePrimaryAction('media_press_conference', 'Delivered national televised press conference')}
              disabled={isAdvancing}
              className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 text-left transition-all hover:border-cyan-600/50 group"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-700/40 text-cyan-400 flex items-center justify-center mb-2">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-stone-200 group-hover:text-cyan-300">Press Conference</div>
              <div className="text-[10px] text-stone-400 mt-0.5">+National Name ID</div>
            </button>

            <button
              onClick={() => handlePrimaryAction('committee_hearing', 'Conducted oversight committee inquiry')}
              disabled={isAdvancing}
              className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 text-left transition-all hover:border-purple-600/50 group"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-700/40 text-purple-400 flex items-center justify-center mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-stone-200 group-hover:text-purple-300">Committee Hearing</div>
              <div className="text-[10px] text-stone-400 mt-0.5">+8 Capital & Seniority</div>
            </button>

            <button
              onClick={() => handlePrimaryAction('party_whip_bargain', 'Brokered backroom compromise with party leadership')}
              disabled={isAdvancing}
              className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 text-left transition-all hover:border-amber-600/50 group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-700/40 text-amber-400 flex items-center justify-center mb-2">
                <Vote className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-stone-200 group-hover:text-amber-300">Whip Bargain</div>
              <div className="text-[10px] text-stone-400 mt-0.5">+7% Party Loyalty</div>
            </button>

            <button
              onClick={() => handlePrimaryAction('routine_session', 'Advanced regular calendar session')}
              disabled={isAdvancing}
              className="p-3 rounded-xl bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 border border-stone-600 text-left transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-600 text-stone-200 flex items-center justify-center mb-2">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-stone-100">Advance Month</div>
              <div className="text-[10px] text-stone-300 mt-0.5">Proceed to Next Turn</div>
            </button>

          </div>
        </section>

        {/* Legislative Chamber & Whip Docket */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-stone-100 font-serif">Legislative Chamber & Whip Board</h3>
              </div>
              <p className="text-xs text-stone-400">
                Author statutory bills, vote measures out of committee, and marshal floor whip divisions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsCaucusModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-amber-600/40 bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 transition-colors flex items-center space-x-1.5"
              >
                <Handshake className="w-3.5 h-3.5 text-amber-400" />
                <span>Backroom Cloakroom</span>
                {session.caucus_deals && session.caucus_deals.filter(d => d.status === 'pending').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-mono font-bold">
                    {session.caucus_deals.filter(d => d.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsEventWebOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>50-Event Causal Web</span>
              </button>

              <button
                onClick={() => {
                  setSelectedBillForModal(null);
                  setIsBillModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Author Bill</span>
              </button>
            </div>
          </div>

          {/* Active Bills Table */}
          {session.bills && session.bills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.bills.map(bill => (
                <div
                  key={bill.id}
                  className="p-5 rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400">
                          {bill.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-current" />
                          <span>Achievement: {bill.achievement_score || 5}/20 pts</span>
                        </span>
                        {bill.status === 'in_committee' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40 text-cyan-300">
                            🤝 Sway: {bill.committee_sway_level || 0} (+{Math.round((bill.committee_sway_level || 0) * 3.5 + (bill.committee_amendments_count || 0) * 6)} momentum)
                          </span>
                        )}
                        {Number(bill.pledged_caucus_votes || 0) > 0 && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/40 text-emerald-300">
                            🏛️ +{bill.pledged_caucus_votes} Caucus Votes
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        bill.status === 'passed'
                          ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                          : bill.status === 'failed'
                          ? 'bg-red-950 border-red-800 text-red-400'
                          : bill.status === 'floor_debate'
                          ? 'bg-amber-950 border-amber-800 text-amber-400'
                          : 'bg-cyan-950 border-cyan-800 text-cyan-400'
                      }`}>
                        {bill.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-stone-100 font-serif leading-snug">{bill.title}</h4>
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1">{bill.summary}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-stone-400">
                      Fiscal: <span className="text-emerald-400 font-bold">
                        {bill.fiscal_impact_billions > 0 ? `+$${bill.fiscal_impact_billions}B` : `-$${Math.abs(bill.fiscal_impact_billions)}B`}
                      </span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBillForModal(bill);
                          setIsBillModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-medium transition-colors"
                      >
                        Read Statute
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBillForWhip(bill);
                          setIsWhipModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs uppercase transition-colors flex items-center space-x-1"
                      >
                        <Vote className="w-3 h-3" />
                        <span>Whip Board</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500 text-xs">
              No bills currently on your legislative docket. Click 'Author Bill' or tell your Chief of Staff to draft one.
            </div>
          )}
        </section>

        {/* Political News Dispatches Wire */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-stone-100 font-serif">Political Press Dispatches</h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">Capitol Gazette • Westminster Wire • Daily Tribune</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {session.news?.slice(0, 3).map((art, idx) => (
              <div key={art.id || idx} className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 uppercase font-bold mb-1.5">
                    <span>{art.publisher.replace('_', ' ')}</span>
                    <span className="text-amber-500">Month {art.month}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-200 font-serif leading-snug mb-2">{art.headline}</h4>
                  <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed">{art.body}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-900 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span>Topic: {art.featured_issue || 'Legislative Politics'}</span>
                  <AudioPlayButton
                    text={`${art.headline}. ${art.body}`}
                    role="political_news"
                    publisher={art.publisher as any}
                    label="Listen"
                    className="text-[10px] py-0.5 px-2 bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Floating Chief of Staff Advisor Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAdvisorOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold font-sans text-xs uppercase tracking-wider shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2.5 border border-amber-400/40"
        >
          <div className="w-6 h-6 rounded-lg bg-stone-950/80 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span>Chief of Staff (Thinking v4-pro)</span>
        </button>
      </div>

      {/* Modals */}
      <PoliticalAdvisorDrawer
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        session={session}
        onRefreshSession={onRefreshSession}
      />

      <PoliticalBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        bill={selectedBillForModal}
        session={session}
        onRefreshSession={onRefreshSession}
        onOpenWhipModal={b => {
          setSelectedBillForWhip(b);
          setIsWhipModalOpen(true);
        }}
      />

      {selectedBillForWhip && (
        <PoliticalWhipModal
          isOpen={isWhipModalOpen}
          onClose={() => {
            setIsWhipModalOpen(false);
            setSelectedBillForWhip(null);
          }}
          bill={selectedBillForWhip}
          session={session}
          onFloorVoteSuccess={(passed, msg) => {
            alert(msg);
            onRefreshSession();
          }}
        />
      )}

      {activeEvent && (
        <PoliticalEventModal
          event={activeEvent}
          onResolve={handleResolveEventChoice}
        />
      )}

      {electionResult && (
        <PoliticalElectionModal
          result={electionResult}
          onClose={() => {
            setElectionResult(null);
            onRefreshSession();
          }}
        />
      )}

      <PoliticalEventWebModal
        isOpen={isEventWebOpen}
        onClose={() => setIsEventWebOpen(false)}
      />

      <PoliticalCampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        session={session}
        onRefreshSession={onRefreshSession}
      />

      <PoliticalCaucusModal
        isOpen={isCaucusModalOpen}
        onClose={() => setIsCaucusModalOpen(false)}
        session={session}
        onRefreshSession={onRefreshSession}
      />

    </div>
  );
};
