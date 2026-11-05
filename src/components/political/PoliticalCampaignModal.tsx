import React, { useState, useEffect } from 'react';
import { PoliticalSession, CampaignOption, DonorQuestion } from '../../types';
import { api } from '../../api';
import { 
  X, Award, Vote, DollarSign, TrendingUp, TrendingDown, 
  HelpCircle, CheckCircle2, AlertTriangle, ArrowRight, 
  ShieldCheck, Sparkles, Building2, Landmark, Users, Clock, Star
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: PoliticalSession;
  onRefreshSession: () => void;
}

export const PoliticalCampaignModal: React.FC<Props> = ({
  isOpen,
  onClose,
  session,
  onRefreshSession
}) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<CampaignOption[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [startingCampaign, setStartingCampaign] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<DonorQuestion | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [roundFeedback, setRoundFeedback] = useState<{
    funds: number;
    label: string;
    promise_title?: string;
    bounty?: number;
    is_controversial?: boolean;
  } | null>(null);

  const pState = session.political_state;
  const declared = pState.declared_campaign;

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      const res = await api.getCampaignOptions(session.id);
      setOptions(res.options || []);
      if (!selectedOfficeId && res.options?.length > 0) {
        // Default to a higher office if available, or first
        const nextHigher = res.options.find((o: any) => !o.is_current_office) || res.options[0];
        setSelectedOfficeId(nextHigher.target_office.id);
      }
      // If there's an ongoing uncompleted campaign with an active question
      if (res.declared_campaign && !res.declared_campaign.completed && res.declared_campaign.questions) {
        const nextIdx = res.declared_campaign.questions_answered || 0;
        setActiveQuestion(res.declared_campaign.questions[nextIdx] || null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCampaignData();
      setRoundFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedOpt = options.find(o => o.target_office.id === selectedOfficeId) || options[0];

  const handleStartCampaign = async () => {
    if (!selectedOfficeId) return;
    setStartingCampaign(true);
    try {
      const res = await api.startCampaign(session.id, selectedOfficeId);
      setActiveQuestion(res.active_question);
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to start campaign');
    } finally {
      setStartingCampaign(false);
    }
  };

  const handleAnswerQuestion = async (optionId: 'A' | 'B' | 'C') => {
    if (!activeQuestion || submittingAnswer) return;
    setSubmittingAnswer(true);
    try {
      const res = await api.answerCampaignQuestion(session.id, activeQuestion.id, optionId);
      const choice = activeQuestion.choices.find(c => c.option_id === optionId);
      setRoundFeedback({
        funds: res.funds_raised_this_round,
        label: choice?.label || 'Strategic Commitment',
        promise_title: res.logged_promise?.promise_title,
        bounty: res.logged_promise?.war_chest_reward_millions,
        is_controversial: res.logged_promise?.is_controversial
      });
      setActiveQuestion(res.next_question || null);
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md font-sans animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100 font-serif">
                Run for Higher Office & Electoral Gauntlet
              </h2>
              <p className="text-xs text-amber-400/90 font-mono">
                Popularity • Terms in Office • Legislative Achievement Score (1-20) • Donor Interrogations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-stone-400 font-serif space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-sm">Evaluating electoral odds, legislative achievements, and donor networks...</p>
          </div>
        ) : declared && !declared.completed && activeQuestion ? (
          /* ========================================================= */
          /* STAGE 2: ACTIVE DONOR VETTING GAUNTLET (PROPORTIONAL Q&A) */
          /* ========================================================= */
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* War Chest Progress Header */}
            <div className="p-4 rounded-2xl bg-stone-950 border border-amber-600/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-0.5">
                  Campaign For {declared.target_title}
                </span>
                <div className="text-sm font-bold text-stone-100 font-serif flex items-center gap-2">
                  <span>Fundraising Gauntlet: Question {activeQuestion.question_number} of {activeQuestion.total_questions}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 font-mono text-stone-300">
                    Proportional to ${(declared.target_war_chest - declared.starting_war_chest).toFixed(1)}M Deficit
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">War Chest Accumulation</div>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    ${pState.war_chest_millions}M <span className="text-xs text-stone-500">/ ${declared.target_war_chest}M Target</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raised Feedback Alert */}
            {roundFeedback && (
              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in shadow-lg">
                <div>
                  <div>
                    Raised <strong className="text-emerald-300 font-mono text-sm">+${roundFeedback.funds}M</strong> from position: "{roundFeedback.label}"
                  </div>
                  {roundFeedback.promise_title && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-amber-300 text-[11px] font-sans">
                      <span>🤝 Logged Donor Compact:</span>
                      <strong className="underline">"{roundFeedback.promise_title}"</strong>
                      <span className="font-mono font-bold text-emerald-400">(+${roundFeedback.bounty}M added to War Chest when legislated!)</span>
                    </div>
                  )}
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>
            )}

            {/* Active Donor Question Card */}
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-600/40 text-amber-300 font-mono text-xs font-bold">
                    {activeQuestion.donor_group}
                  </span>
                  <span className="text-xs text-stone-400 font-sans italic">
                    ({activeQuestion.donor_category})
                  </span>
                </div>
                <span className="text-xs font-mono text-stone-500">
                  Question {activeQuestion.question_number} / {activeQuestion.total_questions}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-100 font-serif mb-2">
                  {activeQuestion.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans bg-stone-900/60 p-4 rounded-xl border border-stone-800/60">
                  "{activeQuestion.prompt}"
                </p>
              </div>

              {/* Choices */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Select Your Tactical Policy Position & Donor Compact:
                </div>

                {activeQuestion.choices.map((choice) => (
                  <button
                    key={choice.option_id}
                    onClick={() => handleAnswerQuestion(choice.option_id)}
                    disabled={submittingAnswer}
                    className="w-full text-left p-4 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-600/60 transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-stone-950 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center font-mono group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                          {choice.option_id}
                        </span>
                        <h4 className="font-bold text-sm text-stone-100 group-hover:text-amber-200">
                          {choice.label}
                        </h4>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        +${choice.funds_raised_millions}M War Chest
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 leading-relaxed pl-8 mb-2">
                      {choice.description}
                    </p>

                    {choice.donor_promise && (
                      <div className="pl-8 mb-2.5">
                        {choice.donor_promise.is_controversial ? (
                          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="text-red-400 font-bold">⚡ Logs Divisive Promise:</span>
                              <span className="font-serif">"{choice.donor_promise.promise_title}"</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px]">
                              +${choice.donor_promise.war_chest_reward_millions}M on passage
                            </span>
                          </div>
                        ) : choice.donor_promise.controversy_level === 'ethical' ? (
                          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="text-emerald-400 font-bold">✨ Logs Clean Accord:</span>
                              <span className="font-serif">"{choice.donor_promise.promise_title}"</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px]">
                              +${choice.donor_promise.war_chest_reward_millions}M on passage
                            </span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="text-amber-400 font-bold">⚖️ Logs Bipartisan Accord:</span>
                              <span className="font-serif">"{choice.donor_promise.promise_title}"</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px]">
                              +${choice.donor_promise.war_chest_reward_millions}M on passage
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pl-8 flex flex-wrap gap-2 text-[10px] font-mono">
                      {choice.political_effects?.polling_margin !== undefined && (
                        <span className={`px-2 py-0.5 rounded border ${
                          choice.political_effects.polling_margin >= 0
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          Polling: {choice.political_effects.polling_margin >= 0 ? '+' : ''}{choice.political_effects.polling_margin}%
                        </span>
                      )}
                      {choice.political_effects?.party_loyalty !== undefined && (
                        <span className={`px-2 py-0.5 rounded border ${
                          choice.political_effects.party_loyalty >= 0
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-stone-800 text-stone-400 border-stone-700'
                        }`}>
                          Wing Loyalty: {choice.political_effects.party_loyalty >= 0 ? '+' : ''}{choice.political_effects.party_loyalty}
                        </span>
                      )}
                      {choice.political_effects?.ethics_scrutiny !== undefined && (
                        <span className={`px-2 py-0.5 rounded border ${
                          choice.political_effects.ethics_scrutiny <= 0
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          Ethics Scrutiny: {choice.political_effects.ethics_scrutiny >= 0 ? '+' : ''}{choice.political_effects.ethics_scrutiny}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* STAGE 1: CHOOSE TARGET OFFICE & REVIEW PROBABILITY METRICS */
          /* ========================================================= */
          <div className="p-6 sm:p-8 space-y-6">

            {/* Politician Current Pedigree Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-stone-950 border border-stone-800">
              <div>
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Terms Served
                </div>
                <div className="text-xl font-bold font-mono text-stone-100">
                  {pState.terms_in_office || 1} <span className="text-xs text-stone-500">term(s)</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" /> Legislative Achievement
                </div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {pState.aggregate_achievement_score || 0} <span className="text-xs text-stone-500">pts (1-20/bill)</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Polling Margin
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {pState.polling_margin >= 0 ? `+${pState.polling_margin}%` : `${pState.polling_margin}%`}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-stone-500 uppercase font-bold flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" /> Current War Chest
                </div>
                <div className="text-xl font-bold font-mono text-stone-100">
                  ${pState.war_chest_millions}M
                </div>
              </div>
            </div>

            {/* Campaign Qualified Banner if completed */}
            {declared && declared.completed && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-200">
                      Campaign Officially Qualified on the Ballot: {declared.target_title}
                    </h4>
                    <p className="text-xs text-emerald-300/80 font-sans">
                      All donor interrogations answered! War chest fully raised (${declared.war_chest_raised}M). Your candidacy will be decided on Election Day (in {pState.months_to_election} months).
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-900 border border-emerald-500 text-emerald-200 rounded-lg">
                  Ballot Ready
                </span>
              </div>
            )}

            {/* Office Selection Grid */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
                <span>Select Target Office to Contest in Upcoming Election:</span>
                <span className="text-stone-400 font-sans font-normal text-[11px]">
                  (Higher offices demand larger legislative achievement & donor vetting)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {options.map((opt) => {
                  const isSelected = selectedOfficeId === opt.target_office.id;
                  const isCurrent = opt.is_current_office;

                  return (
                    <div
                      key={opt.target_office.id}
                      onClick={() => setSelectedOfficeId(opt.target_office.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500 shadow-xl ring-2 ring-amber-500/20'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                            isCurrent 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {isCurrent ? 'Current Office' : 'Higher Office'}
                          </span>

                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {opt.win_probability}% Win Odds
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-stone-100 font-serif mb-1">
                          {opt.target_office.title}
                        </h3>
                        <p className="text-[11px] text-stone-400 leading-relaxed mb-4">
                          {opt.target_office.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-stone-900 text-xs font-mono">
                        <div className="flex items-center justify-between text-stone-400">
                          <span>Target War Chest:</span>
                          <span className="font-bold text-stone-200">${opt.target_office.target_war_chest}M</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-400">
                          <span>Achievement Score:</span>
                          <span className={`font-bold ${
                            (pState.aggregate_achievement_score || 0) >= opt.target_office.target_achievement
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}>
                            {pState.aggregate_achievement_score || 0} / {opt.target_office.target_achievement} pts
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-stone-400">
                          <span>Donor Questions:</span>
                          <span className="font-bold text-purple-400">
                            {opt.questions_required} Questions
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Probability Breakdown Analysis Panel */}
            {selectedOpt && (
              <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300 font-mono">
                      Electoral Probability Calculus for {selectedOpt.target_office.title}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Projected Vote Share: {selectedOpt.expected_vote_share}% (Win Odds: {selectedOpt.win_probability}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase">Popularity & Polling</div>
                    <div className={`text-sm font-bold ${selectedOpt.breakdown.polling_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedOpt.breakdown.polling_score >= 0 ? '+' : ''}{selectedOpt.breakdown.polling_score}%
                    </div>
                    <span className="text-[10px] text-stone-500">Margin: {pState.polling_margin}%</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase">Seniority & Terms</div>
                    <div className={`text-sm font-bold ${selectedOpt.breakdown.terms_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedOpt.breakdown.terms_score >= 0 ? '+' : ''}{selectedOpt.breakdown.terms_score}%
                    </div>
                    <span className="text-[10px] text-stone-500">{pState.terms_in_office || 1} of {selectedOpt.target_office.min_terms} min terms</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase">Bills Achievement Score</div>
                    <div className={`text-sm font-bold ${selectedOpt.breakdown.achievement_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedOpt.breakdown.achievement_score >= 0 ? '+' : ''}{selectedOpt.breakdown.achievement_score}%
                    </div>
                    <span className="text-[10px] text-stone-500">{pState.aggregate_achievement_score || 0} / {selectedOpt.target_office.target_achievement} pts</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase">Macro Economic Drag</div>
                    <div className={`text-sm font-bold ${selectedOpt.breakdown.macro_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedOpt.breakdown.macro_score >= 0 ? '+' : ''}{selectedOpt.breakdown.macro_score}%
                    </div>
                    <span className="text-[10px] text-stone-500">CPI & Growth impact</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 italic font-sans pt-1">
                  * Note: If you launch this campaign, you will undergo a high-dollar donor vetting gauntlet answering <strong>{selectedOpt.questions_required} questions</strong> to raise the ${(selectedOpt.metrics.deficit).toFixed(1)}M deficit.
                </div>
              </div>
            )}

            {/* Launch Action Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleStartCampaign}
                disabled={startingCampaign || (declared?.target_office_id === selectedOfficeId && declared.completed)}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold font-sans text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                <span>{startingCampaign ? 'Convening Donors...' : `Launch Campaign for ${selectedOpt.target_office.title} (${selectedOpt.questions_required} Donor Questions)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
