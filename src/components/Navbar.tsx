import React from 'react';
import { User, GameSession } from '../types';
import { Landmark, Shield, UserCircle, LogOut, Sliders, Globe, Award, HelpCircle } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeSession: GameSession | null;
  currentView: 'landing' | 'game' | 'admin';
  onNavigate: (view: 'landing' | 'game' | 'admin') => void;
  onOpenAuth: () => void;
  onOpenEventWeb: () => void;
  onLogout: () => void;
  onNewGamePrompt: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeSession,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenEventWeb,
  onLogout,
  onNewGamePrompt
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/20 border border-amber-400/40 group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-prestige text-lg font-bold tracking-wider text-slate-100 group-hover:text-amber-400 transition-colors">
                CENTRAL BANK BONANZA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                SIMULATOR
              </span>
            </div>
            <p className="text-xs text-slate-400 font-serif-headline italic">
              Monetary Policy & Macroeconomic Governance
            </p>
          </div>
        </div>

        {/* Center Live Simulation Status (if game is active) */}
        {activeSession && currentView === 'game' && (
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-200">Year {activeSession.current_year}</span>
              <span className="text-slate-500">•</span>
              <span className="font-semibold text-amber-400">Month {activeSession.current_month}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Q{activeSession.current_quarter} M{activeSession.month_in_quarter}</span>
            </div>

            <div className="h-3 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Rate:</span>
              <span className="font-data font-bold text-amber-300">{activeSession.economic_state.interest_rate.toFixed(2)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">CPI:</span>
              <span className={`font-data font-bold ${activeSession.economic_state.inflation_cpi > 4.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeSession.economic_state.inflation_cpi.toFixed(2)}%
              </span>
            </div>

            <div className="h-3 w-px bg-slate-800"></div>

            <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {activeSession.play_mode === 'first_person' ? 'First Person' : 'God Mode'}
            </span>
          </div>
        )}

        {/* Right Navigation & User Controls */}
        <div className="flex items-center gap-3">
          {/* 50-Event Web Link */}
          <button
            onClick={onOpenEventWeb}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            title="Browse the 50 Backwards-Planned Causal Events"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>50-Event Web</span>
          </button>

          {/* Admin Dashboard button */}
          <button
            onClick={() => onNavigate(currentView === 'admin' ? (activeSession ? 'game' : 'landing') : 'admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentView === 'admin' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900 border border-transparent hover:border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Desk</span>
          </button>

          {/* If Game Active, Resume/New Game buttons */}
          {activeSession && currentView !== 'game' && (
            <button
              onClick={() => onNavigate('game')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-all"
            >
              Resume Game
            </button>
          )}

          {activeSession && currentView === 'game' && (
            <button
              onClick={onNewGamePrompt}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 transition-all"
              title="Start a new tenure"
            >
              New Career
            </button>
          )}

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden xl:inline text-xs font-medium text-slate-300 max-w-[120px] truncate">
                {user.display_name}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 transition-all"
            >
              <UserCircle className="w-3.5 h-3.5" />
              <span>Governor Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
