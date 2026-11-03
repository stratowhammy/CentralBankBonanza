import React from 'react';
import { LayoutDashboard, Landmark, MessageSquare, LineChart, Vote, UserCircle, BellRing } from 'lucide-react';
import { User, GameSession } from '../types';

interface AndroidBottomNavProps {
  currentView: 'landing' | 'game' | 'admin' | 'user_portal';
  user: User | null;
  activeSession: GameSession | null;
  onNavigate: (view: 'landing' | 'game' | 'admin' | 'user_portal') => void;
  onOpenAdvisor?: () => void;
  onOpenGraphTracker?: () => void;
  onOpenActionModal?: () => void;
  onOpenAuth: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  currentView,
  user,
  activeSession,
  onNavigate,
  onOpenAdvisor,
  onOpenGraphTracker,
  onOpenActionModal,
  onOpenAuth
}) => {
  const isInGame = currentView === 'game' && !!activeSession;
  const isMpcMonth = activeSession?.month_in_quarter === 3;

  return (
    <nav className="md:hidden android-bottom-bar" aria-label="Mobile Navigation">
      
      {/* 1. Simulations / Portal */}
      <button
        onClick={() => onNavigate('user_portal')}
        className={`android-nav-tab ${currentView === 'user_portal' ? 'active' : ''}`}
        aria-label="My Simulations"
      >
        <div className="android-nav-indicator">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <span className="android-nav-text">Portal</span>
      </button>

      {/* 2. Cockpit / Game Simulation */}
      {activeSession ? (
        <button
          onClick={() => onNavigate('game')}
          className={`android-nav-tab ${currentView === 'game' ? 'active' : ''}`}
          aria-label="Central Bank Cockpit"
        >
          <div className="android-nav-indicator">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="android-nav-text">Cockpit</span>
        </button>
      ) : (
        <button
          onClick={() => onNavigate('user_portal')}
          className={`android-nav-tab ${currentView === 'landing' ? 'active' : ''}`}
          aria-label="Simulator"
        >
          <div className="android-nav-indicator">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="android-nav-text">Simulator</span>
        </button>
      )}

      {/* 3. Economic Advisor (Available if session active) */}
      {isInGame && onOpenAdvisor ? (
        <button
          onClick={onOpenAdvisor}
          className="android-nav-tab"
          aria-label="Economic Advisor"
        >
          <div className="android-nav-indicator">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="android-nav-text">Advisor</span>
        </button>
      ) : null}

      {/* 4. Graph Tracker (Available if session active) */}
      {isInGame && onOpenGraphTracker ? (
        <button
          onClick={onOpenGraphTracker}
          className="android-nav-tab"
          aria-label="Graph Tracker"
        >
          <div className="android-nav-indicator">
            <LineChart className="w-5 h-5" />
          </div>
          <span className="android-nav-text">Tracker</span>
        </button>
      ) : null}

      {/* 5. Policy Decision Action (if in game) OR User Profile / Auth */}
      {isInGame && onOpenActionModal ? (
        <button
          onClick={onOpenActionModal}
          className="android-nav-tab"
          aria-label="Monetary Policy Action"
        >
          <div className="android-nav-indicator" style={{ backgroundColor: 'rgba(245, 158, 11, 0.28)', color: '#fbbf24' }}>
            {isMpcMonth ? <Vote className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
          </div>
          <span className="android-nav-text" style={{ color: '#fbbf24', fontWeight: 700 }}>
            {isMpcMonth ? 'MPC Vote' : 'Guidance'}
          </span>
        </button>
      ) : (
        <button
          onClick={onOpenAuth}
          className="android-nav-tab"
          aria-label="Account Profile"
        >
          <div className="android-nav-indicator">
            <UserCircle className="w-5 h-5" />
          </div>
          <span className="android-nav-text">
            {user ? (user.username === 'guest' ? 'Guest' : user.username) : 'Sign In'}
          </span>
        </button>
      )}

    </nav>
  );
};
