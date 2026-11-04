import { GameSession, User, EventCatalogItem } from './types';

const API_BASE = '/api';

export const api = {
  // Auth
  async register(username: string, password: string, display_name?: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async login(username: string, password: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async guestLogin(): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/guest`, { method: 'POST' });
    if (!res.ok) throw new Error('Guest login failed');
    return res.json();
  },

  async getUserProfile(userId: string) {
    const res = await fetch(`${API_BASE}/auth/profile/${userId}`);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  // Game
  async startNewGame(params: {
    user_id: string;
    chair_name: string;
    play_mode: 'first_person' | 'god_mode';
    difficulty?: 'easy' | 'normal' | 'hard';
    economy_type?: 'large_hegemon' | 'middle_advanced' | 'small_emerging';
    starting_condition?: 'easy' | 'normal' | 'hard';
    volatility?: 'low' | 'normal' | 'high' | 'extreme';
    skip_news?: boolean;
  }): Promise<{ success: boolean; session: GameSession }> {
    const res = await fetch(`${API_BASE}/game/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start game');
    }
    return res.json();
  },

  async getGameSession(sessionId: string): Promise<{ session: GameSession }> {
    const res = await fetch(`${API_BASE}/game/${sessionId}`);
    if (!res.ok) throw new Error('Failed to load game session');
    return res.json();
  },

  async submitAction(sessionId: string, params: {
    action_type: 'guidance' | 'silence' | 'mpc_rate_decision';
    action_value?: string;
    statement?: string;
  }) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to advance turn');
    }
    return res.json();
  },

  async switchChair(sessionId: string, next_chair_id: string) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/switch-chair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_chair_id })
    });
    if (!res.ok) throw new Error('Failed to switch chair');
    return res.json();
  },

  async getDotPlot(sessionId: string) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/dot-plot`);
    if (!res.ok) throw new Error('Failed to load dot plot');
    return res.json();
  },

  async updateBalanceSheet(sessionId: string, params: { qt_monthly_pace?: number; discount_window_active?: boolean }) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/balance-sheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to update balance sheet');
    return res.json();
  },

  async executeFxIntervention(sessionId: string, params: { action_type: 'defend_currency' | 'accumulate_reserves'; amount_billions?: number }) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/fx-intervention`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to execute FX intervention');
    return res.json();
  },

  async getParliamentHearing(sessionId: string) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/parliament-hearing`);
    if (!res.ok) throw new Error('Failed to load parliamentary hearing');
    return res.json();
  },

  async submitParliamentHearing(sessionId: string, choices: Record<string, string>) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/parliament-hearing/testify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choices })
    });
    if (!res.ok) throw new Error('Failed to submit testimony');
    return res.json();
  },

  async declineParliamentHearing(sessionId: string) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/parliament-hearing/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to decline parliamentary hearing');
    return res.json();
  },

  async getTermReview(sessionId: string) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/term-review`);
    if (!res.ok) throw new Error('Failed to load term review');
    return res.json();
  },

  async acceptReappointment(sessionId: string) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/term-review/reappoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to accept reappointment');
    return res.json();
  },

  async getSimulationsList(userId?: string): Promise<{ simulations: any[] }> {
    const url = userId ? `${API_BASE}/game/simulations/list?user_id=${encodeURIComponent(userId)}` : `${API_BASE}/game/simulations/list`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load simulations list');
    return res.json();
  },

  async simulateMonths(sessionId: string, months: number) {
    const res = await fetch(`${API_BASE}/game/${sessionId}/simulate-months`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ months })
    });
    if (!res.ok) throw new Error('Failed to simulate months');
    return res.json();
  },

  async deleteSimulation(sessionId: string) {
    const res = await fetch(`${API_BASE}/game/${sessionId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete simulation');
    return res.json();
  },

  // Advisor
  async sendAdvisorChat(sessionId: string, message: string, current_rate?: number): Promise<{
    success: boolean;
    reply: string;
    action_taken?: 'legislation_proposed' | 'media_blitz_executed' | null;
    policy?: any;
    media_blitz?: any;
    updated_state?: any;
  }> {
    const res = await fetch(`${API_BASE}/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message, current_rate })
    });
    if (!res.ok) throw new Error('Advisor chat failed');
    return res.json();
  },

  async getAdvisorActionsHistory(sessionId: string): Promise<{ policies: any[]; media_blitzes: any[] }> {
    const res = await fetch(`${API_BASE}/advisor/history/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch advisor actions history');
    return res.json();
  },

  async getAdvisorMessages(sessionId: string) {
    const res = await fetch(`${API_BASE}/advisor/messages/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async submitPolicyIdea(sessionId: string, raw_idea: string, target_sector: string) {
    const res = await fetch(`${API_BASE}/advisor/submit-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, raw_idea, target_sector })
    });
    if (!res.ok) throw new Error('Failed to submit policy');
    return res.json();
  },

  async launchMediaBlitz(sessionId: string, target_audience: string, strategic_message: string) {
    const res = await fetch(`${API_BASE}/advisor/media-blitz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, target_audience, strategic_message })
    });
    if (!res.ok) throw new Error('Failed to launch media blitz');
    return res.json();
  },

  // Admin
  async getAdminDashboard() {
    const res = await fetch(`${API_BASE}/admin/dashboard`);
    if (!res.ok) throw new Error('Failed to load admin dashboard');
    return res.json();
  },

  async getEventsCatalog(): Promise<{ total: number; events: EventCatalogItem[] }> {
    const res = await fetch(`${API_BASE}/admin/events-catalog`);
    if (!res.ok) throw new Error('Failed to load events catalog');
    return res.json();
  },

  async injectShock(sessionId: string, eventId: string) {
    const res = await fetch(`${API_BASE}/admin/inject-shock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, event_id: eventId })
    });
    if (!res.ok) throw new Error('Failed to inject shock');
    return res.json();
  },

  async tweakEconomy(sessionId: string, variable: string, value: number) {
    const res = await fetch(`${API_BASE}/admin/tweak-economy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, variable, value })
    });
    if (!res.ok) throw new Error('Failed to tweak economy');
    return res.json();
  },

  async updateSettings(settings: { 
    deepseek_api_key?: string; 
    deepseek_model?: string; 
    llm_provider?: string;
    google_tts_api_key?: string;
    google_tts_model?: string;
    google_tts_voice?: string;
  }) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // TTS Synthesis
  async synthesizeTts(params: {
    text: string;
    role?: 'news' | 'advisor';
    publisher?: string;
    speaker?: string;
    voice?: string;
  }): Promise<{
    audio_base64?: string;
    mime_type?: string;
    model?: string;
    voice?: string;
    text?: string;
    fallback?: boolean;
    reason?: string;
  }> {
    const res = await fetch(`${API_BASE}/tts/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'TTS synthesis failed');
    }
    return res.json();
  },

  // ==========================================
  // POLITICAL SIMULATOR (STATECRAFT) API
  // ==========================================

  async startNewPoliticalCareer(params: {
    user_id: string;
    politician_name: string;
    system_type: 'parliamentary' | 'congressional';
    selected_track?: string;
    party_name?: string;
    district_name?: string;
    linked_cbs_session_id?: string;
  }) {
    const res = await fetch(`${API_BASE}/political/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start political career');
    }
    return res.json();
  },

  async getPoliticalSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}`);
    if (!res.ok) throw new Error('Failed to load political session');
    return res.json();
  },

  async getPoliticalSessions(userId: string) {
    const res = await fetch(`${API_BASE}/political/sessions?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to list political sessions');
    return res.json();
  },

  async submitPoliticalAction(sessionId: string, params: {
    action_type: string;
    action_details?: string;
    event_choice?: any;
  }) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to advance political turn');
    }
    return res.json();
  },

  async draftPoliticalBill(sessionId: string, params: {
    title: string;
    category: string;
    fiscal_impact_billions: number;
    summary?: string;
  }) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}/bill/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to draft bill');
    return res.json();
  },

  async submitBillToCommittee(sessionId: string, billId: string) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}/bill/${billId}/committee`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to submit bill to committee');
    return res.json();
  },

  async getWhipCount(sessionId: string, billId: string, capitalSpent: number = 0) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}/bill/${billId}/whip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capital_spent: capitalSpent })
    });
    if (!res.ok) throw new Error('Failed to calculate whip count');
    return res.json();
  },

  async floorVoteBill(sessionId: string, billId: string, capitalSpent: number = 0) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}/bill/${billId}/floor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capital_spent: capitalSpent })
    });
    if (!res.ok) throw new Error('Failed to conduct floor vote');
    return res.json();
  },

  async promotePolitician(sessionId: string) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}/promote`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to promote politician');
    return res.json();
  },

  async sendPoliticalAdvisorChat(sessionId: string, message: string) {
    const res = await fetch(`${API_BASE}/political/session/${sessionId}/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Failed to send message to Chief of Staff');
    return res.json();
  }
};
