import React, { useState } from 'react';
import { PlayMode, Difficulty } from '../types';
import { 
  Landmark, 
  TrendingUp, 
  Newspaper, 
  Scale, 
  MessageSquare, 
  ShieldAlert, 
  Compass, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Award,
  Crown,
  UserCheck
} from 'lucide-react';

interface LandingPageProps {
  onStartGame: (params: {
    chair_name: string;
    play_mode: PlayMode;
    difficulty: Difficulty;
  }) => void;
  hasActiveSession: boolean;
  onResumeGame: () => void;
  onOpenEventWeb: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartGame,
  hasActiveSession,
  onResumeGame,
  onOpenEventWeb
}) => {
  const [chairName, setChairName] = useState('Helena Vance');
  const [playMode, setPlayMode] = useState<PlayMode>('first_person');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isStarting, setIsStarting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    onStartGame({
      chair_name: chairName.trim() || 'Helena Vance',
      play_mode: playMode,
      difficulty
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10"></div>
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-20 sm:pt-16 sm:pb-28">
        
        {/* Top Eyebrow */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wide shadow-lg shadow-amber-950/20">
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>The Premier Macroeconomic & Monetary Policy Simulator</span>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <h1 className="font-prestige text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 leading-[1.1]">
            STEER THE ECONOMY. <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              WEATHER THE SHOCKS.
            </span>
          </h1>
          <p className="font-editorial text-lg sm:text-2xl text-slate-300 italic max-w-2xl mx-auto leading-relaxed">
            "A test of nerves, economic judgment, and political survival for central bank governors facing the unpredictable tides of modern markets."
          </p>
        </div>

        {/* Main Game Setup Card */}
        <div className="mt-12 max-w-3xl mx-auto bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="absolute -top-3 left-8 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider">
            Appointment Protocol
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Governor Name */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                Central Bank Chair Identity
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={chairName}
                  onChange={(e) => setChairName(e.target.value)}
                  placeholder="e.g. Chair Helena Vance, Paul Volcker..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 font-serif-headline text-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-600"
                  required
                />
                <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-mono">
                  CHAIR-APPT
                </span>
              </div>
            </div>

            {/* Play Mode Selector: First Person vs God Mode */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                Select Simulation Perspective
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* First Person Card */}
                <div 
                  onClick={() => setPlayMode('first_person')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    playMode === 'first_person'
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-100">First Person Mode</span>
                    </div>
                    {playMode === 'first_person' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    You are in the hot seat. You must steer inflation and employment while <strong className="text-amber-300">keeping your job</strong> against restless parliamentarians and hostile editorial boards.
                  </p>
                </div>

                {/* God Mode Card */}
                <div 
                  onClick={() => setPlayMode('god_mode')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    playMode === 'god_mode'
                      ? 'bg-indigo-500/10 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        <Crown className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-100">God Mode</span>
                    </div>
                    {playMode === 'god_mode' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Track a dynasty of Central Bank Chairs across eras. <strong className="text-indigo-300">Chairs gain trust the longer they serve</strong>, making market responses more anchored and muted over time.
                  </p>
                </div>

              </div>
            </div>

            {/* Difficulty Mode (Newspaper Complexity) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Information & Simulation Complexity
                </label>
                <span className="text-[11px] text-amber-400 font-mono">
                  {difficulty === 'easy' && '2 Publishers • Macro Focus'}
                  {difficulty === 'normal' && '3 Publishers • Macro + Social'}
                  {difficulty === 'hard' && '4 Publishers • Macro + Social + Hard Politics'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Easy */}
                <div
                  onClick={() => setDifficulty('easy')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    difficulty === 'easy'
                      ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs uppercase mb-1 flex items-center justify-between">
                    <span>Easy</span>
                    {difficulty === 'easy' && <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Active</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">Gloomberg + Doll Street</p>
                    <p>Core aggregate inflation, GDP, yields & corporate earnings.</p>
                  </div>
                </div>

                {/* Normal */}
                <div
                  onClick={() => setDifficulty('normal')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    difficulty === 'normal'
                      ? 'bg-amber-500/10 border-amber-500/60 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs uppercase mb-1 flex items-center justify-between">
                    <span>Normal</span>
                    {difficulty === 'normal' && <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">Recommended</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">+ Gotham News Tribune</p>
                    <p>Adds housing affordability, real wages, strikes & living standards.</p>
                  </div>
                </div>

                {/* Hard */}
                <div
                  onClick={() => setDifficulty('hard')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    difficulty === 'hard'
                      ? 'bg-rose-500/10 border-rose-500/60 text-rose-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs uppercase mb-1 flex items-center justify-between">
                    <span>Hard</span>
                    {difficulty === 'hard' && <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">Brutal</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">+ The Cashington Post</p>
                    <p>Adds parliamentary committee heat, fiscal clashes & election clocks.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Launch Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={isStarting}
                className="w-full sm:flex-1 py-4 px-6 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isStarting ? 'Preparing First Month Gazette...' : 'Accept Appointment & Swear Oath'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {hasActiveSession && (
                <button
                  type="button"
                  onClick={onResumeGame}
                  className="w-full sm:w-auto py-4 px-6 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  Resume Active Career
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Feature Grid: 4 Core Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Newspaper className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200 mb-2">Monthly Editorial Desks</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Read 250–500 word reports from Gloomberg, Doll Street, Gotham, and Cashington Post. Each story mirrors your economic conditions without giving answers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200 mb-2">Quarterly Decision Cadence</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Months 1 & 2: choose forward guidance or silence to shape expectations. Month 3: take the big vote on interest rates in quarter-percent steps.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200 mb-2">Chief of Staff & Parliament</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Consult your embedded economic advisor, have them refine policy ideas and send them to Parliament for a vote, or orchestrate targeted media blitzes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200 mb-2">50 Backwards-Planned Shocks</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              The economy dynamically experiences 25 positive and 25 negative structural events, backwards-planned from over 750 root causal precursors.
            </p>
            <button
              onClick={onOpenEventWeb}
              className="mt-3 text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1"
            >
              <span>Explore Event Web</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
