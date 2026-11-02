import React, { useState, useEffect } from 'react';
import { User, GameSession, PlayMode, Difficulty, ActionType } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { GameDashboard } from './components/GameDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { EventWebModal } from './components/EventWebModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'game' | 'admin'>('landing');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEventWebOpen, setIsEventWebOpen] = useState(false);

  // Auto-login guest or check existing session on mount
  useEffect(() => {
    // Try to restore saved session or login as guest
    const savedUser = localStorage.getItem('cbb_user');
    const savedSessionId = localStorage.getItem('cbb_session_id');

    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (savedSessionId) {
          api.getGameSession(savedSessionId)
            .then(res => {
              setActiveSession(res.session);
            })
            .catch(() => {
              localStorage.removeItem('cbb_session_id');
            });
        }
      } catch {
        // ignore
      }
    } else {
      // Automatic guest login for zero-friction launch
      api.guestLogin()
        .then(res => {
          setCurrentUser(res.user);
          localStorage.setItem('cbb_user', JSON.stringify(res.user));
        })
        .catch(() => {});
    }
  }, []);

  // Start new game
  const handleStartGame = async (params: {
    chair_name: string;
    play_mode: PlayMode;
    difficulty: Difficulty;
  }) => {
    let user = currentUser;
    if (!user) {
      try {
        const res = await api.guestLogin();
        user = res.user;
        setCurrentUser(user);
        localStorage.setItem('cbb_user', JSON.stringify(user));
      } catch (err: any) {
        alert('Could not initialize session user');
        return;
      }
    }

    try {
      const res = await api.startNewGame({
        user_id: user.id,
        chair_name: params.chair_name,
        play_mode: params.play_mode,
        difficulty: params.difficulty
      });
      setActiveSession(res.session);
      localStorage.setItem('cbb_session_id', res.session.id);
      setCurrentView('game');
    } catch (err: any) {
      alert(err.message || 'Failed to start game session');
    }
  };

  // Submit action in game
  const handleSubmitAction = async (params: {
    action_type: ActionType;
    action_value?: string;
    statement?: string;
  }) => {
    if (!activeSession) return;
    try {
      const res = await api.submitAction(activeSession.id, params);
      
      // Update session with new month data
      const updatedSession: GameSession = {
        ...activeSession,
        current_year: res.current_year,
        current_month: res.current_month,
        month_in_quarter: res.month_in_quarter,
        current_quarter: res.current_quarter,
        total_months_elapsed: res.total_months_elapsed,
        status: res.status,
        economic_state: res.economic_state,
        chair_state: res.chair_state,
        taylor_rule: res.taylor_rule,
        news_articles: res.news_articles,
        history: [
          ...(activeSession.history || []),
          {
            year: activeSession.current_year,
            month: activeSession.current_month,
            quarter: activeSession.current_quarter,
            month_in_quarter: activeSession.month_in_quarter,
            action_type: params.action_type,
            action_value: params.action_value || '',
            statement: params.statement || '',
            economic_snapshot: JSON.stringify(res.economic_state)
          }
        ]
      };

      setActiveSession(updatedSession);
    } catch (err: any) {
      alert(err.message || 'Failed to advance turn');
    }
  };

  // Switch chair in God Mode
  const handleSwitchChair = async (nextChairId: string) => {
    if (!activeSession) return;
    try {
      const res = await api.switchChair(activeSession.id, nextChairId);
      setActiveSession({
        ...activeSession,
        chair_name: res.chair_state.active_chair.name,
        chair_state: res.chair_state
      });
    } catch (err: any) {
      alert(err.message || 'Failed to switch chair');
    }
  };

  // Refresh active session from DB
  const handleRefreshSession = async () => {
    if (!activeSession) return;
    try {
      const res = await api.getGameSession(activeSession.id);
      setActiveSession(res.session);
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cbb_user');
  };

  const handleAuthSuccess = (u: User) => {
    setCurrentUser(u);
    localStorage.setItem('cbb_user', JSON.stringify(u));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Global Navigation */}
      <Navbar
        user={currentUser}
        activeSession={activeSession}
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenEventWeb={() => setIsEventWebOpen(true)}
        onLogout={handleLogout}
        onNewGamePrompt={() => setCurrentView('landing')}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onStartGame={handleStartGame}
            hasActiveSession={!!activeSession}
            onResumeGame={() => setCurrentView('game')}
            onOpenEventWeb={() => setIsEventWebOpen(true)}
          />
        )}

        {currentView === 'game' && activeSession && (
          <GameDashboard
            session={activeSession}
            onSubmitAction={handleSubmitAction}
            onSwitchChair={handleSwitchChair}
            onRefreshSession={handleRefreshSession}
          />
        )}

        {currentView === 'game' && !activeSession && (
          <div className="max-w-md mx-auto my-20 p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="font-prestige font-bold text-lg mb-2">No Active Career Found</h3>
            <p className="text-xs text-slate-400 mb-6">Start a new central bank appointment on the home screen.</p>
            <button
              onClick={() => setCurrentView('landing')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase"
            >
              Go to Landing Page
            </button>
          </div>
        )}

        {currentView === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <EventWebModal
        isOpen={isEventWebOpen}
        onClose={() => setIsEventWebOpen(false)}
      />

    </div>
  );
};
