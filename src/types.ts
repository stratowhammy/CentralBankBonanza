export type PlayMode = 'first_person' | 'god_mode';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type ActionType = 'guidance' | 'silence' | 'mpc_rate_decision' | 'inaugural';
export type PublisherType = 'gloomberg' | 'doll_street' | 'gotham' | 'cashington';

export interface EconomicState {
  // Core Macro Variables
  interest_rate: number;
  inflation_cpi: number;
  core_inflation: number;
  unemployment_rate: number;
  gdp_growth: number;
  stock_market_index: number;
  bond_yield_10y: number;
  bond_yield_2y: number;
  currency_index: number;
  bank_lending_rate: number;

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

  // First Person Job Security
  job_security: number;
  warning_count: number;

  // Active Shocks
  active_events: ActiveEvent[];
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

export interface GameSession {
  id: string;
  user_id: string;
  chair_name: string;
  play_mode: PlayMode;
  difficulty: Difficulty;
  status: 'active' | 'retired' | 'dismissed' | 'term_completed';
  current_year: number;
  current_month: number;
  month_in_quarter: number;
  current_quarter: number;
  total_months_elapsed: number;
  economic_state: EconomicState;
  chair_state: ChairState;
  taylor_rule: number;
  news_articles: NewsArticle[];
  history?: TurnSnapshot[];
  policies?: PolicyProposal[];
  media_blitzes?: MediaBlitz[];
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: 'player' | 'admin';
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
