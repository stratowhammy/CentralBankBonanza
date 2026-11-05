import React, { useState, useEffect } from 'react';
import { PoliticalSession, User } from '../../types';
import { api } from '../../api';
import { PoliticalLanding } from './PoliticalLanding';
import { PoliticalDashboard } from './PoliticalDashboard';

interface Props {
  user: User | null;
  onSwitchToCbs: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const PoliticalApp: React.FC<Props> = ({ user, onSwitchToCbs, onOpenAuth, onLogout }) => {
  const [activeSession, setActiveSession] = useState<PoliticalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing session from localStorage if present
  useEffect(() => {
    const savedId = localStorage.getItem('ps_session_id');

    if (savedId) {
      api.getPoliticalSession(savedId)
        .then(res => {
          setActiveSession(res.session);
        })
        .catch(() => {
          localStorage.removeItem('ps_session_id');
          setActiveSession(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleStartCareer = async (params: {
    politician_name: string;
    system_type: 'parliamentary' | 'congressional';
    selected_track?: string;
    party_name: string;
    district_name: string;
    linked_cbs_session_id?: string;
    economy_type?: string;
    starting_condition?: string;
    volatility?: string;
  }) => {
    if (!user || user.username === 'guest') {
      if (onOpenAuth) onOpenAuth();
      alert('Registration required. Please sign in or create an account to start a political simulation.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.startNewPoliticalCareer({
        user_id: user.id,
        ...params
      });
      setActiveSession(res.session);
      localStorage.setItem('ps_session_id', res.session.id);
    } catch (err: any) {
      alert(err.message || 'Failed to start political career');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeCareer = (session: PoliticalSession) => {
    setActiveSession(session);
    localStorage.setItem('ps_session_id', session.id);
  };

  const handleExitCareer = () => {
    setActiveSession(null);
    localStorage.removeItem('ps_session_id');
  };

  const handleRefreshSession = async () => {
    if (!activeSession) return;
    try {
      const res = await api.getPoliticalSession(activeSession.id);
      setActiveSession(res.session);
    } catch (err) {
      console.error('Error refreshing political session:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center font-serif">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400 animate-pulse">
            🏛️
          </div>
          <div className="font-bold text-lg text-amber-200">Convening the Legislative Chamber...</div>
          <p className="text-xs text-stone-400 font-sans">Loading Statecraft: The Political Simulator</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-serif">
      {activeSession ? (
        <PoliticalDashboard
          session={activeSession}
          user={user}
          onRefreshSession={handleRefreshSession}
          onSwitchToCbs={onSwitchToCbs}
          onNewCareer={handleExitCareer}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
        />
      ) : (
        <PoliticalLanding
          user={user}
          onStartCareer={handleStartCareer}
          onResumeCareer={handleResumeCareer}
          onSwitchToCbs={onSwitchToCbs}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
        />
      )}
    </div>
  );
};
