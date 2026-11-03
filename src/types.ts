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
  created_at: string;
}

export interface MediaBlitz {
  id: string;
  target_audience: 'wall_street' | 'main_street' | 'parliament' | 'foreign_fx';
  strategic_message: string;
  public_response: string;
  impact_summary: string;
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
