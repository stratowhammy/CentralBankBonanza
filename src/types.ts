export type PlayMode = 'first_person' | 'god_mode';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type EconomyType = 'large_hegemon' | 'middle_advanced' | 'small_emerging';
export type StartingCondition = 'easy' | 'normal' | 'hard';
export type VolatilityLevel = 'low' | 'normal' | 'high' | 'extreme';
export type ActionType = 'guidance' | 'silence' | 'mpc_rate_decision' | 'inaugural';
export type PublisherType = 'gloomberg' | 'doll_street' | 'gotham' | 'cashington';

export interface EconomicState {
  // Economy Type & Volatility Configuration
  economy_type?: EconomyType;
  starting_condition?: StartingCondition;
  volatility?: VolatilityLevel;

  // Core Macro Variables
  interest_rate: number;
  inflation_cpi: number;
  flexible_cpi?: number;
  sticky_cpi?: number;
  core_inflation: number;
  unemployment_rate: number;
  gdp_growth: number;
  stock_market_index: number;
  bond_yield_10y: number;
  bond_yield_2y: number;
  currency_index: number;
  bank_lending_rate: number;

  // Small & Middle Open Economy Telemetry
  foreign_benchmark_rate?: number;
  sovereign_risk_spread?: number; // bps over foreign benchmark
  fx_reserves_billions?: number; // $B
  import_share_of_cpi?: number;
  capital_flow_momentum?: number; // $B/mo

  // Pillar E: Balance Sheet & Emergency Tools
  balance_sheet_size?: number; // $T
  qt_monthly_pace?: number;    // $B/mo
  discount_window_active?: boolean;
  discount_window_rate?: number;

  // Pillar C: Credibility & Taper Tantrum
  market_credibility?: number;
  recent_guidance?: { month: number; stance: string }[];
  credibility_warning?: string | null;

  // Social & Living Standards (Normal + Hard)
  real_wage_growth: number;
  housing_cost_index: number;
  consumer_confidence: number;
  poverty_discontent: number;
  wealth_inequality_gini: number;

  // Political & Governance (Hard)
  parliamentary_approval: number;
  public_approval: number;
  fiscal_deficit: number;
  debt_to_gdp: number;
  central_bank_autonomy: number;
  months_to_election: number;

  // First Person Job Security & Term Tracking
  job_security: number;
  warning_count: number;
  term_months_completed?: number;
  reappointment_count?: number;

  // Active Shocks & MPC Votes
  active_events: ActiveEvent[];
  last_mpc_vote?: MPCVotingResult | null;
}

export interface MPCMemberVote {
  member_id: string;
  name: string;
  role: string;
  hawkishness: number;
  preferred_rate: number;
  preferred_delta_bps: number;
  vote: 'AYE' | 'DISSENT_HAWK' | 'DISSENT_DOVE';
  rationale: string;
}

export interface MPCVotingResult {
  proposed_rate: number;
  proposed_delta_bps: number;
  ayes: number;
  dissents: number;
  hawkish_dissents: number;
  dovish_dissents: number;
  passed: boolean;
  tally_label: string;
  member_votes: MPCMemberVote[];
  consensus_summary: string;
}

export interface DotPlotMemberDot {
  member_id: string;
  name: string;
  role: string;
  year_1: string;
  year_2: string;
  long_run: string;
}

export interface DotPlotData {
  current_rate: number;
  median_projections: {
    year_1: number;
    year_2: number;
    long_run: number;
  };
  dots: DotPlotMemberDot[];
}

export interface ActiveEvent {
  id: string;
  name: string;
  category: string;
  polarity: 'Positive' | 'Negative';
  impact: number;
  tier: string;
  summary: string;
  duration_remaining: number;
}

export interface ChairProfile {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar_color: string;
  starting_trust: number;
  tenure_months: number;
  hawkishness: number;
  tenure_end_year?: number;
  tenure_end_month?: number;
}

export interface ChairState {
  active_chair: ChairProfile;
  active_chair_index?: number;
  chair_history: ChairProfile[];
  cumulative_years_managed?: number;
  crises_resolved?: number;
  prestige_rank?: string;
}

export interface NewsArticle {
  publisher: PublisherType;
  headline: string;
  body: string;
  tone: 'hawkish' | 'dovish' | 'alarmist' | 'bullish' | 'critical' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  featured_variable: string;
  byline?: string;
  dateline?: string;
  whisper_quote?: string;
}

export interface TurnSnapshot {
  year: number;
  month: number;
  quarter: number;
  month_in_quarter: number;
  action_type: ActionType;
  action_value: string;
  statement?: string;
  economic_snapshot: string; // JSON
}

export interface PolicyProposal {
  id: string;
  title: string;
  raw_idea: string;
  refined_legislation: string;
  target_sector: string;
  status: 'pending' | 'passed' | 'rejected';
  parliament_vote_for: number;
  parliament_vote_against: number;
  enacted_effects?: string | Record<string, number>;
  year?: number;
  month?: number;
  created_at: string;
}

export interface MediaBlitz {
  id: string;
  target_audience: 'wall_street' | 'main_street' | 'parliament' | 'foreign_fx';
  strategic_message: string;
  public_response: string;
  impact_summary: string;
  year?: number;
  month?: number;
  created_at: string;
}

export interface AdvisorMessage {
  id?: string;
  sender: 'user' | 'advisor';
  content: string;
  created_at?: string;
}

export interface HearingStrategy {
  key: string;
  label: string;
  dialogue: string;
  parl_approval_delta: number;
  autonomy_delta: number;
  market_credibility_delta: number;
  public_approval_delta: number;
}

export interface ParliamentaryQuestion {
  id: string;
  interrogator: string;
  question: string;
  strategies: HearingStrategy[];
}

export interface ParliamentaryHearingData {
  session_id: string;
  current_year: number;
  current_month: number;
  parliamentary_approval: number;
  public_approval: number;
  questions: ParliamentaryQuestion[];
  completed?: boolean;
  completed_summary?: string;
  declined?: boolean;
}

export interface TermReviewScorecard {
  chair_name: string;
  months_in_office: number;
  avg_inflation_deviation: string;
  avg_gdp_growth: string;
  avg_unemployment: string;
  current_inflation: number;
  parliamentary_approval: number;
  market_credibility: number;
  verdict: 'REAPPOINTED' | 'NOT_REAPPOINTED';
  verdict_title: string;
  citation: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  chair_name: string;
  play_mode: PlayMode;
  difficulty: Difficulty;
  economy_type?: EconomyType;
  starting_condition?: StartingCondition;
  volatility?: VolatilityLevel;
  status: 'active' | 'retired' | 'dismissed' | 'term_completed';
  current_year: number;
  current_month: number;
  month_in_quarter: number;
  current_quarter: number;
  total_months_elapsed: number;
  economic_state: EconomicState;
  chair_state: ChairState;
  taylor_rule: number;
  dot_plot?: DotPlotData;
  last_mpc_vote?: MPCVotingResult | null;
  news_articles: NewsArticle[];
  history?: TurnSnapshot[];
  policies?: PolicyProposal[];
  media_blitzes?: MediaBlitz[];
  hearing_eligible?: boolean;
  term_review_eligible?: boolean;
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: 'player' | 'admin';
}

export interface SimulationListItem {
  id: string;
  user_id: string;
  chair_name: string;
  play_mode: PlayMode;
  difficulty: Difficulty;
  economy_type?: EconomyType;
  starting_condition?: StartingCondition;
  volatility?: VolatilityLevel;
  status: 'active' | 'retired' | 'dismissed' | 'term_completed';
  current_year: number;
  current_month: number;
  total_months_elapsed: number;
  created_at: string;
  updated_at: string;
  results: {
    interest_rate: number;
    inflation_cpi: number;
    parliamentary_approval: number;
    public_approval: number;
    job_security: number;
    warning_count: number;
    reappointment_count: number;
    market_credibility: number;
    last_action_details: string;
  };
}

export interface EventCatalogItem {
  id: string;
  name: string;
  polarity: 'Positive' | 'Negative';
  category: string;
  impact_min: number;
  impact_max: number;
  impact_tier: string;
  summary: string;
  contributing_factors: {
    factor_id: string;
    factor_name: string;
    mechanism: string;
    sub_factors: {
      sub_factor_id: string;
      sub_factor_name: string;
      description: string;
    }[];
  }[];
}

// ==========================================
// POLITICAL SIMULATOR (STATECRAFT) TYPES
// ==========================================

export type PoliticalSystemType = 'unicameral' | 'bicameral' | 'parliamentary' | 'congressional';

export interface IndicatorTag {
  category: string;
  direction: 'favorable' | 'unfavorable' | 'neutral' | 'alert';
}

export interface PoliticalAlignmentOption {
  id: string;
  label: string;
  description: string;
  indicators: IndicatorTag[];
}

export interface PoliticalAlignmentQuestion {
  id: string;
  number: number;
  category: string;
  title: string;
  prompt: string;
  options: PoliticalAlignmentOption[];
}

export interface QuizEvaluationResult {
  assigned_caucus_id: string;
  assigned_caucus_name: string;
  assigned_caucus_ideology: string;
  assigned_caucus_member_count: number;
  original_leader: string;
  player_title: string;
  scores: Record<string, number>;
  alignment_summary: string;
}

export interface MajorNationalIssue {
  id: string;
  category: 'social' | 'geopolitical' | 'economic' | 'national_political';
  title: string;
  description: string;
  salience: number; // 0-100
  trend: 'surging' | 'stable' | 'cooling';
  attribute_type: 'standard' | 'scandal_risk' | 'corruption_concern' | 'civic_strength';
  public_sentiment: 'reformist' | 'conservative' | 'divided' | 'neutral';
  caucus_stances: Record<string, 'champion' | 'oppose' | 'compromise' | 'neutral' | 'divided'>;
}

export interface LobbyingContract {
  id: string;
  session_id: string;
  trade_group: string;
  sector: string;
  chief_lobbyist: string;
  favor_title: string;
  favor_description: string;
  statutory_category: string;
  campaign_contribution_millions: number;
  completion_bounty_millions: number;
  ethics_risk_level: 'low' | 'medium' | 'high' | 'toxic';
  suggested_bill_title?: string;
  suggested_bill_summary?: string;
  suggested_fiscal_impact?: number;
  indicators?: IndicatorTag[];
  status: 'pending' | 'accepted' | 'fulfilled' | 'rejected';
  legislated_bill_id?: string | null;
  created_year: number;
  created_month: number;
  created_at?: string;
  resolved_at?: string | null;
}

export interface PoliticalCaucus {
  id: string;
  name: string;
  leader: string;
  member_count: number;
  ideology: string;
  priorities: string[];
  is_player_led?: boolean;
  is_ai?: boolean;
  pending_personal_demand?: boolean;
  personal_prompt?: string | null;
  docket_bills?: Array<{
    title: string;
    summary: string;
    category: string;
    fiscal_impact: number;
  }>;
}

export interface CaucusDirectMessage {
  id: string;
  session_id: string;
  caucus_id: string;
  caucus_leader_name: string;
  sender: 'user' | 'advisor' | 'caucus_leader' | 'system';
  channel: 'direct_dm' | 'aide_channel';
  content: string;
  requires_personal_response?: number | boolean;
  personal_prompt?: string | null;
  personal_response_submitted?: number | boolean;
  deal_offered_json?: string | null;
  created_year?: number;
  created_month?: number;
  created_at: string;
}

export type PoliticalTrackId = 
  | 'backbencher' 
  | 'committee_chair' 
  | 'cabinet_minister' 
  | 'prime_minister'
  | 'representative' 
  | 'senator' 
  | 'president';

export interface PartyWing {
  name: string;
  share: number;
  base_loyalty: number;
  priority: string;
}

export interface PoliticalState {
  politician_name?: string;
  politician_title: string;
  current_stage_id: PoliticalTrackId;
  chamber: string;
  system_type: PoliticalSystemType;
  legislature_name?: string;
  executive_title?: string;
  party_name: string;
  party_ideology: string;
  party_wings: PartyWing[];
  district_name: string;
  
  // Caucus Leadership
  player_caucus_id?: string | null;
  player_caucus_name?: string | null;
  is_caucus_leader?: boolean;
  quiz_alignment?: string | null;
  
  // Telemetry
  district_approval: number; // 0-100
  national_approval: number; // 0-100
  party_loyalty: number;     // 0-100
  political_capital: number; // 0-100
  war_chest_millions: number;
  ethics_scrutiny: number;   // 0-100
  polling_margin: number;    // +/- %
  coalition_stability: number;
  media_sentiment: number;   // -100 to +100
  
  // Stats
  legislative_seniority: number;
  terms_in_office?: number;
  aggregate_achievement_score?: number;
  last_election_vote_share?: number;
  bills_sponsored: number;
  bills_passed: number;
  hearings_held: number;
  townhalls_conducted: number;
  fundraisers_held: number;
  
  committee_name: string;
  promotion_available: boolean;
  next_stage_id: PoliticalTrackId | null;
  months_to_election: number;
  election_year_span: number;
  declared_campaign?: DeclaredCampaign | null;
  major_issues?: MajorNationalIssue[];
}

export interface DonorQuestionPromiseMetadata {
  promise_key?: string;
  promise_title: string;
  promise_description?: string;
  donor_group: string;
  donor_category?: string;
  statutory_category: string;
  suggested_bill_title: string;
  suggested_summary: string;
  suggested_fiscal_impact: number;
  public_support: number;
  war_chest_reward_millions: number;
  is_controversial: boolean;
  controversy_level: 'ethical' | 'moderate' | 'divisive' | 'corrupt';
}

export interface DonorQuestionChoice {
  option_id: 'A' | 'B' | 'C';
  label: string;
  description: string;
  funds_raised_millions: number;
  donor_promise?: DonorQuestionPromiseMetadata | null;
  political_effects: {
    polling_margin?: number;
    party_loyalty?: number;
    ethics_scrutiny?: number;
    national_approval?: number;
  };
}

export interface DonorQuestion {
  id: string;
  donor_group: string;
  donor_category: string;
  title: string;
  prompt: string;
  question_number: number;
  total_questions: number;
  choices: DonorQuestionChoice[];
}

export interface DeclaredCampaign {
  target_office_id: PoliticalTrackId;
  target_title: string;
  chamber: string;
  target_war_chest: number;
  starting_war_chest: number;
  war_chest_raised: number;
  questions_total: number;
  questions_answered: number;
  completed: boolean;
  questions?: DonorQuestion[];
  donor_log?: Array<{
    question_id: string;
    donor_group: string;
    choice_id: string;
    choice_label: string;
    funds_raised: number;
    effects: any;
  }>;
}

export interface CampaignOption {
  target_office: {
    id: PoliticalTrackId;
    title: string;
    chamber: string;
    system_type: PoliticalSystemType;
    target_war_chest: number;
    target_achievement: number;
    min_terms: number;
    term_months: number;
    description: string;
    powers_summary: string;
  };
  expected_vote_share: number;
  win_probability: number;
  questions_required: number;
  is_current_office: boolean;
  breakdown: {
    polling_score: number;
    last_election_score: number;
    approval_score: number;
    terms_score: number;
    achievement_score: number;
    fund_score: number;
    macro_score: number;
    ethics_score: number;
  };
  metrics: {
    terms_served: number;
    min_terms_recommended: number;
    aggregate_achievement_score: number;
    target_achievement_score: number;
    war_chest_millions: number;
    target_war_chest: number;
    deficit: number;
  };
}

export interface PoliticalBill {
  id: string;
  session_id: string;
  title: string;
  summary: string;
  statutory_text: string;
  category: string;
  fiscal_impact_billions: number;
  achievement_score?: number; // Magnitude 1-20
  status: 'drafting' | 'in_committee' | 'floor_debate' | 'passed' | 'failed' | 'vetoed';
  donor_promise_id?: string | null;
  lobbying_contract_id?: string | null;
  committee_name?: string;
  committee_vote_aye?: number;
  committee_vote_nay?: number;
  committee_capital_spent?: number;
  committee_sway_level?: number;
  committee_amendments_count?: number;
  pledged_caucus_votes?: number;
  caucus_deals?: string;
  whip_count?: string; // JSON
  floor_vote_aye?: number;
  floor_vote_nay?: number;
  public_support?: number;
  sponsor_capital_spent?: number;
  year_introduced?: number;
  month_introduced?: number;
  year_resolved?: number;
  month_resolved?: number;
  created_at?: string;
}

export interface PoliticalDonorPromise {
  id: string;
  session_id: string;
  promise_key?: string;
  donor_group: string;
  donor_category?: string;
  promise_title: string;
  promise_description: string;
  statutory_category: string;
  suggested_bill_title: string;
  suggested_summary: string;
  suggested_fiscal_impact: number;
  public_support: number;
  war_chest_reward_millions: number;
  initial_funds_raised: number;
  controversy_level: 'ethical' | 'moderate' | 'divisive' | 'corrupt';
  is_controversial: boolean;
  status: 'pending' | 'legislated' | 'broken';
  legislated_bill_id?: string | null;
  created_year: number;
  created_month: number;
  created_at?: string;
  legislated_at?: string | null;
}

export interface WhipCountResult {
  total_seats: number;
  majority_threshold: number;
  passed: boolean;
  total_ayes: number;
  total_nays: number;
  undecided: number;
  breakdown: {
    party_ayes: number;
    party_nays: number;
    party_undecided: number;
    opposition_ayes: number;
    opposition_nays: number;
    committee_momentum_votes?: number;
    pledged_caucus_votes?: number;
    capital_bonus_votes?: number;
  };
  whip_assessment: string;
}

export interface CaucusDeal {
  id: string;
  session_id: string;
  caucus_id: string;
  caucus_name: string;
  caucus_leader: string;
  member_count: number;
  ideology: string;
  docket_bill_title: string;
  docket_bill_summary: string;
  docket_bill_category: string;
  docket_bill_impact: number;
  user_target_bill_id?: string;
  user_target_bill_title?: string;
  pledged_votes: number;
  demands_description: string;
  status: 'pending' | 'accepted' | 'rejected';
  year_proposed: number;
  month_proposed: number;
  created_at?: string;
}

export interface PoliticalNewsArticle {
  id: string;
  session_id: string;
  year: number;
  month: number;
  publisher: string;
  headline: string;
  body: string;
  tone: string;
  urgency: string;
  featured_issue?: string;
}

export interface PoliticalTurnHistoryItem {
  id: string;
  session_id: string;
  year: number;
  month: number;
  action_type: string;
  action_details?: string;
  political_snapshot: string;
  economic_snapshot: string;
  active_events?: string;
  created_at: string;
}

export interface PoliticalAdvisorMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'advisor';
  content: string;
  created_at: string;
}

export interface PoliticalEventChoice {
  option_id: 'A' | 'B' | 'C';
  label: string;
  description: string;
  political_effects: {
    district_approval?: number;
    national_approval?: number;
    party_loyalty?: number;
    war_chest?: number;
    political_capital?: number;
  };
  economic_effects?: Record<string, number>;
}

export interface PoliticalEvent {
  id: string;
  name: string;
  polarity: 'Positive' | 'Negative';
  category: string;
  impact_min: number;
  impact_max: number;
  impact_tier: string;
  summary: string;
  choices: PoliticalEventChoice[];
  duration_remaining?: number;
}

export interface PoliticalSession {
  id: string;
  user_id: string;
  politician_name: string;
  system_type: PoliticalSystemType;
  political_track: PoliticalTrackId;
  party_name: string;
  party_ideology: string;
  district_name: string;
  status: 'active' | 're_elected' | 'defeated' | 'resigned' | 'promoted';
  current_year: number;
  current_month: number;
  total_months_elapsed: number;
  months_to_election: number;
  linked_cbs_session_id?: string | null;
  political_state: PoliticalState;
  economic_state: EconomicState;
  active_events: PoliticalEvent[];
  bills?: PoliticalBill[];
  news?: PoliticalNewsArticle[];
  history?: PoliticalTurnHistoryItem[];
  messages?: PoliticalAdvisorMessage[];
  caucus_deals?: CaucusDeal[];
  donor_promises?: PoliticalDonorPromise[];
  lobbying_contracts?: LobbyingContract[];
  major_issues?: MajorNationalIssue[];
  caucuses?: PoliticalCaucus[];
  caucus_dms?: CaucusDirectMessage[];
  player_caucus?: PoliticalCaucus | null;
  player_caucus_id?: string | null;
  player_caucus_name?: string | null;
  created_at: string;
  updated_at: string;
}

