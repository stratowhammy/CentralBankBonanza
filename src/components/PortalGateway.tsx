import React from 'react';
import { Landmark, Vote, Scale, Shield, ArrowRight, Sparkles, Building2, TrendingUp, Users, DollarSign } from 'lucide-react';

interface Props {
  onSelectSimulator: (sim: 'cbs' | 'ps') => void;
}

export const PortalGateway: React.FC<Props> = ({ onSelectSimulator }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg flex items-center justify-center text-slate-950 font-bold">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-slate-100 font-serif">Sovereign Statecraft & Monetary Suite</h1>
            <p className="text-xs text-slate-400">Integrated Macroeconomic & Political Simulation Ecosystem</p>
          </div>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
          Tandem Shared Engine Architecture
        </div>
      </header>

      {/* Main Dual Portal Selection Deck */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-mono uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 inline-block">
            Choose Your Seat of Power
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight text-white mb-4">
            Two Spheres. One Economy.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Select your sovereign career portal below. Both applications run on the same causal macroeconomic 
            telemetry engine and can be played as standalone simulations or linked in multiplayer tandem.
          </p>
        </div>

        {/* The Two Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Portal 1: Central Bank Simulator (~/cbs) */}
          <div className="group rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-950/20 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
                  <Landmark className="w-8 h-8" />
                </div>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400">
                  ~/cbs
                </span>
              </div>

              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-1">
                Monetary Authority & Stability
              </div>
              <h3 className="text-2xl font-bold font-serif text-white mb-3">
                Central Bank Bonanza
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans">
                Assume the governorship of the sovereign central bank. Set interest rates, manage quantitative easing / tightening, 
                target 2% CPI inflation, preserve market credibility, and steer the yield curve through 50 backwards-planned macroeconomic events.
              </p>

              <div className="space-y-2 mb-8 text-xs font-sans text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>9-Member Monetary Policy Committee (MPC) Dot Plots</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Yield curve inversion & sovereign bond spread modeling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>4 Editorial News Desks (Gloomberg, Doll Street, Gotham, Cashington)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Parliamentary confirmation hearings & Chief of Staff counsel</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectSimulator('cbs')}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 group-hover:scale-[1.02]"
            >
              <span>Enter Central Bank Simulator (~/cbs)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 2: Political Simulator (~/ps) */}
          <div className="group rounded-3xl border border-stone-800 bg-gradient-to-b from-stone-900/90 to-stone-950 p-8 flex flex-col justify-between hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-950/20 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl group-hover:bg-red-600/10 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-700/40 text-red-400 flex items-center justify-center shadow-inner">
                  <Vote className="w-8 h-8" />
                </div>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-red-400">
                  ~/ps
                </span>
              </div>

              <div className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 mb-1">
                Legislative Power & Electoral Survival
              </div>
              <h3 className="text-2xl font-bold font-serif text-white mb-3">
                Statecraft: The Political Simulator
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed mb-6 font-sans">
                Climb from backbench parliamentarian or house representative to Prime Minister or President. 
                Author statutory bills, calculate floor whip counts, survive election cycles, and navigate constituent fury over living costs.
              </p>

              <div className="space-y-2 mb-8 text-xs font-sans text-stone-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Dual tracks: Westminster Parliament vs US Congressional System</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Chief of Staff with deep thinking v4-pro & statutory drafting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>50 Political Events (25 positive, 25 negative) with 150 choices</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Floor division roll-call voting & whip arm-twisting operations</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectSimulator('ps')}
              className="w-full py-4 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 group-hover:scale-[1.02]"
            >
              <span>Enter Political Simulator (~/ps)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-slate-500 font-mono">
          Navigate directly via <span className="text-amber-400">/cbs</span> or <span className="text-red-400">/ps</span> at any time.
        </div>

      </main>

    </div>
  );
};
