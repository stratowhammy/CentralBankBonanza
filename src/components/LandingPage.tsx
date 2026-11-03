import React, { useState } from 'react';
import { PlayMode, Difficulty, EconomyType, StartingCondition, VolatilityLevel } from '../types';
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
  UserCheck,
  Globe,
  Activity,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onStartGame: (params: {
    chair_name: string;
    play_mode: PlayMode;
    difficulty?: Difficulty;
    economy_type?: EconomyType;
    starting_condition?: StartingCondition;
    volatility?: VolatilityLevel;
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
  const [economyType, setEconomyType] = useState<EconomyType>('large_hegemon');
  const [startingCondition, setStartingCondition] = useState<StartingCondition>('normal');
  const [volatility, setVolatility] = useState<VolatilityLevel>('normal');
  const [isStarting, setIsStarting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    onStartGame({
      chair_name: chairName.trim() || 'Helena Vance',
      play_mode: playMode,
      difficulty: startingCondition,
      economy_type: economyType,
      starting_condition: startingCondition,
      volatility: volatility
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10"></div>
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-24 sm:pt-16 sm:pb-28 android-scroll-bottom-clearance">
        
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

            {/* Economy Scale & Central Bank Jurisdiction */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nation Scale & Central Bank Jurisdiction</span>
                </label>
                <span className="text-[11px] font-mono text-cyan-400">
                  {economyType === 'large_hegemon' && 'Hegemonic Reserve Currency'}
                  {economyType === 'middle_advanced' && 'Open Economy • Capital Flow Sensitive'}
                  {economyType === 'small_emerging' && 'High Pass-Through • FX Reserve Desk'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: 'large_hegemon',
                    title: 'Large Hegemon',
                    subtitle: 'US / Eurozone Parallel',
                    desc: 'Sets global reference rate. Trillion-dollar QE/QT balance sheet. Low currency pass-through.'
                  },
                  {
                    key: 'middle_advanced',
                    title: 'Middle Advanced',
                    subtitle: 'Canada / Australia / Korea',
                    desc: 'Open economy. Policy rate gap with global benchmark triggers hot money inflows/flight.'
                  },
                  {
                    key: 'small_emerging',
                    title: 'Small Open Economy',
                    subtitle: 'Emerging Market Parallel',
                    desc: 'High import CPI pass-through. Sovereign risk spread and direct FX reserve intervention desk.'
                  }
                ].map(opt => (
                  <div
                    key={opt.key}
                    onClick={() => setEconomyType(opt.key as EconomyType)}
                    className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                      economyType === opt.key
                        ? 'bg-cyan-500/15 border-cyan-400 text-white ring-1 ring-cyan-400/60 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase mb-0.5 flex items-center justify-between text-slate-100">
                      <span>{opt.title}</span>
                      {economyType === opt.key && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 mb-1">{opt.subtitle}</div>
                    <div className="text-[11px] text-slate-400 leading-snug">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Starting Macro Condition */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Starting Macro Condition</span>
                </label>
                <span className="text-[11px] text-amber-400 font-mono">
                  {startingCondition === 'easy' && 'Anchored Inflation • 2 Publishers'}
                  {startingCondition === 'normal' && 'Stagflationary Squeeze • 3 Publishers'}
                  {startingCondition === 'hard' && 'Crisis & Hostile Parliament • 4 Publishers'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Easy */}
                <div
                  onClick={() => setStartingCondition('easy')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    startingCondition === 'easy'
                      ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-400/40 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs uppercase mb-1 flex items-center justify-between">
                    <span>Goldilocks (Easy)</span>
                    {startingCondition === 'easy' && <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Active</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">Gloomberg + Doll Street</p>
                    <p>Controlled 2.1% CPI, steady 2.4% GDP growth, and calm political climate.</p>
                  </div>
                </div>

                {/* Normal */}
                <div
                  onClick={() => setStartingCondition('normal')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    startingCondition === 'normal'
                      ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 ring-1 ring-amber-400/40 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs uppercase mb-1 flex items-center justify-between">
                    <span>Stagflationary (Normal)</span>
                    {startingCondition === 'normal' && <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">Recommended</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">+ Gotham News Tribune</p>
                    <p>Sticky 4.5% CPI, sluggish growth, housing pressures, and union discontent.</p>
                  </div>
                </div>

                {/* Hard */}
                <div
                  onClick={() => setStartingCondition('hard')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    startingCondition === 'hard'
                      ? 'bg-rose-500/10 border-rose-500/60 text-rose-300 ring-1 ring-rose-400/40 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs uppercase mb-1 flex items-center justify-between">
                    <span>Crisis Inheritance (Hard)</span>
                    {startingCondition === 'hard' && <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">Brutal</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="text-slate-300 font-medium">+ The Cashington Post</p>
                    <p>Runaway 7.8% CPI, inverted yield curve, debt constraints, and parliamentary grilling.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Macro Volatility */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Macro Volatility & Geopolitical Shock Frequency</span>
                </label>
                <span className="text-[11px] text-purple-400 font-mono capitalize">
                  {volatility} Volatility
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'low', title: 'Low (Calm)', desc: '10% shock chance, stable demand' },
                  { key: 'normal', title: 'Normal (Cyclical)', desc: '22% shock chance, standard business cycles' },
                  { key: 'high', title: 'High (Choppy)', desc: '40% shock chance, frequent crises' },
                  { key: 'extreme', title: 'Extreme (Chaos)', desc: '60% shock chance, multi-front shocks' }
                ].map(opt => (
                  <div
                    key={opt.key}
                    onClick={() => setVolatility(opt.key as VolatilityLevel)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all ${
                      volatility === opt.key
                        ? 'bg-purple-500/15 border-purple-400 text-white ring-1 ring-purple-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-100 flex items-center justify-between">
                      <span>{opt.title}</span>
                      {volatility === opt.key && <Check className="w-3 h-3 text-purple-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</div>
                  </div>
                ))}
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
            <h3 className="font-bold text-sm text-slate-200 mb-2">Dynamic Structural Shocks</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              The economy dynamically experiences positive and negative structural shocks affecting commodity prices, industrial output, and consumer expectations.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
