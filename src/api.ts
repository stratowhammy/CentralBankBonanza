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
    difficulty: 'easy' | 'normal' | 'hard';
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
  async sendAdvisorChat(sessionId: string, message: string, current_rate?: number): Promise<{ success: boolean; reply: string }> {
    const res = await fetch(`${API_BASE}/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message, current_rate })
    });
    if (!res.ok) throw new Error('Advisor chat failed');
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

  async updateSettings(settings: { deepseek_api_key?: string; deepseek_model?: string; llm_provider?: string }) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
