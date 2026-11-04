import React, { useState, useEffect } from 'react';
import { PoliticalSession, User } from '../../types';
import { api } from '../../api';
import { PoliticalLanding } from './PoliticalLanding';
import { PoliticalDashboard } from './PoliticalDashboard';

interface Props {
  user: User | null;
  onSwitchToCbs: () => void;
}

export const PoliticalApp: React.FC<Props> = ({ user, onSwitchToCbs }) => {
  const [activeSession, setActiveSession] = useState<PoliticalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing session from localStorage or fetch last session
  useEffect(() => {
    const savedId = localStorage.getItem('ps_session_id');
    const effectiveUserId = user?.id || 'user_guest_default';

    if (savedId) {
      api.getPoliticalSession(savedId)
        .then(res => {
          setActiveSession(res.session);
        })
        .catch(() => {
          localStorage.removeItem('ps_session_id');
          // Try fetching any sessions for user
          fetchUserSessions(effectiveUserId);
        })
        .finally(() => setIsLoading(false));
    } else {
      fetchUserSessions(effectiveUserId);
    }
  }, [user]);

  const fetchUserSessions = (userId: string) => {
    api.getPoliticalSessions(userId)
      .then(res => {
        if (res.sessions && res.sessions.length > 0) {
          const latest = res.sessions[0];
          setActiveSession(latest);
          localStorage.setItem('ps_session_id', latest.id);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const handleStartCareer = async (params: {
    politician_name: string;
    system_type: 'parliamentary' | 'congressional';
    selected_track?: string;
    party_name: string;
    district_name: string;
    linked_cbs_session_id?: string;
  }) => {
    setIsLoading(true);
    try {
      const effectiveUserId = user?.id || 'user_guest_default';
      const res = await api.startNewPoliticalCareer({
        user_id: effectiveUserId,
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
          onRefreshSession={handleRefreshSession}
          onSwitchToCbs={onSwitchToCbs}
          onNewCareer={() => {
            setActiveSession(null);
            localStorage.removeItem('ps_session_id');
          }}
        />
      ) : (
        <PoliticalLanding
          onStartCareer={handleStartCareer}
          onSwitchToCbs={onSwitchToCbs}
        />
      )}
    </div>
  );
};
