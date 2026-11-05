import React from 'react';
import { User, GameSession } from '../types';
import { Landmark, UserCircle, LogOut, Sliders, LayoutDashboard, Compass, Play, Vote } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeSession: GameSession | null;
  currentView: 'landing' | 'game' | 'admin' | 'user_portal';
  onNavigate: (view: 'landing' | 'game' | 'admin' | 'user_portal') => void;
  onOpenAuth: () => void;
  onOpenEventWeb: () => void;
  onLogout: () => void;
  onNewGamePrompt: () => void;
  onSwitchToPoliticalSim?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeSession,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenEventWeb,
  onLogout,
  onNewGamePrompt,
  onSwitchToPoliticalSim
}) => {
  const isKlimbus = user?.username === 'kbunghole' || user?.display_name?.toLowerCase().includes('klimbus');
  const isAdmin = user?.role === 'admin' && user?.username === 'admin' && !isKlimbus;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 md:py-3 android-top-bar">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onNavigate(isAdmin ? 'landing' : 'user_portal')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md border border-amber-400/40 flex-shrink-0">
            <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-xs sm:text-base tracking-wide text-slate-100">
                CENTRAL BANK SIM
              </span>
              {!isAdmin && (
                <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Portal
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Live Status: Mobile Pill */}
        {activeSession && currentView === 'game' && (
          <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Y{activeSession.current_year} M{activeSession.current_month}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-amber-300 font-bold">{activeSession.economic_state.interest_rate.toFixed(2)}%</span>
          </div>
        )}

        {/* Center Live Status: Desktop */}
        {activeSession && currentView === 'game' && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-300">Year {activeSession.current_year}, Month {activeSession.current_month}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-amber-300">Rate: {activeSession.economic_state.interest_rate.toFixed(2)}%</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-emerald-400">CPI: {activeSession.economic_state.inflation_cpi.toFixed(2)}%</span>
          </div>
        )}

        {/* Right Navigation & User Controls */}
        <div className="flex items-center gap-3">
          
          {/* Switch to Political Simulator Button */}
          {onSwitchToPoliticalSim && (
            <button
              onClick={onSwitchToPoliticalSim}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-950 to-stone-900 border border-red-700/50 text-red-300 hover:text-red-200 hover:border-red-500 transition-all cursor-pointer shadow-sm"
              title="Switch to Statecraft: Political Simulator (~/ps)"
            >
              <Vote className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Political Sim (~/ps)</span>
            </button>
          )}
          
          {/* Regular user navigation */}
          {!isAdmin && (
            <>
              {currentView === 'game' ? (
                <button
                  onClick={() => onNavigate('user_portal')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>My Simulations</span>
                </button>
              ) : activeSession ? (
                <button
                  onClick={() => onNavigate('game')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Enter Simulation</span>
                </button>
              ) : null}
            </>
          )}

          {/* Admin-only navigation buttons */}
          {isAdmin && (
            <>
              <button
                onClick={() => onNavigate('user_portal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'user_portal'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>User Portal</span>
              </button>

              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin Desk</span>
              </button>

              <button
                onClick={onOpenEventWeb}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Event Web</span>
              </button>

              {activeSession && currentView !== 'game' && (
                <button
                  onClick={() => onNavigate('game')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Macro View
                </button>
              )}
            </>
          )}

          {/* User Profile / Auth */}
          {user && user.username !== 'guest' ? (
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
            >
              <UserCircle className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
