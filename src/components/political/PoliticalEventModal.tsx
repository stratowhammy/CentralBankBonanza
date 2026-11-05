import React, { useState } from 'react';
import { PoliticalEvent, PoliticalEventChoice } from '../../types';
import { AlertTriangle, CheckCircle2, Sparkles, TrendingUp, TrendingDown, Landmark, ArrowRight, ShieldAlert } from 'lucide-react';

interface Props {
  event: PoliticalEvent;
  onResolve: (choice: PoliticalEventChoice) => void;
}

export const PoliticalEventModal: React.FC<Props> = ({ event, onResolve }) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C'>('A');

  const choices = event.choices || [];
  const chosen = choices.find(c => c.option_id === selectedOption) || choices[0];

  const isPositive = event.polarity === 'Positive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans animate-fade-in">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Alert Strip */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isPositive 
            ? 'bg-emerald-950/80 border-emerald-800/40 text-emerald-300' 
            : 'bg-red-950/80 border-red-800/40 text-red-300'
        }`}>
          <div className="flex items-center space-x-3">
            {isPositive ? <Sparkles className="w-6 h-6 text-emerald-400" /> : <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider font-mono">
                {isPositive ? 'National Breakthrough Event' : 'High-Stakes Political Crisis'} • Tier: {event.impact_tier}
              </div>
              <h3 className="font-bold text-lg text-stone-100 font-serif leading-tight">{event.name}</h3>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide font-mono bg-stone-900 border border-stone-800">
            {event.category}
          </span>
        </div>

        {/* Event Narrative Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs sm:text-sm leading-relaxed">
            {event.summary}
          </div>

          {/* Strategic Choices */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              Strategic Executive Decision
            </label>
            <div className="space-y-3">
              {choices.map(c => {
                const isSelected = selectedOption === c.option_id;
                return (
                  <div
                    key={c.option_id}
                    onClick={() => setSelectedOption(c.option_id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/20 text-stone-100 ring-1 ring-amber-500 shadow-md'
                        : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                        }`}>
                          {c.option_id}
                        </span>
                        <h4 className="font-bold text-sm text-stone-200">{c.label}</h4>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>

                    <p className="text-xs text-stone-400 leading-normal mb-3 pl-8">
                      {c.description}
                    </p>

                    {/* Indicators Strip (Category and Color only - no numerical weights) */}
                    <div className="pl-8 flex flex-wrap gap-2 text-[10px] font-sans font-medium">
                      {c.political_effects.district_approval !== undefined && (
                        <span className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                          c.political_effects.district_approval > 0 
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                            : c.political_effects.district_approval < 0
                            ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                            : 'bg-stone-800/60 border-stone-700 text-stone-400'
                        }`}>
                          <span>District App</span>
                          <span className="font-bold">{c.political_effects.district_approval > 0 ? '▲' : c.political_effects.district_approval < 0 ? '▼' : '▬'}</span>
                        </span>
                      )}

                      {c.political_effects.national_approval !== undefined && (
                        <span className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                          c.political_effects.national_approval > 0 
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400' 
                            : c.political_effects.national_approval < 0
                            ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                            : 'bg-stone-800/60 border-stone-700 text-stone-400'
                        }`}>
                          <span>National App</span>
                          <span className="font-bold">{c.political_effects.national_approval > 0 ? '▲' : c.political_effects.national_approval < 0 ? '▼' : '▬'}</span>
                        </span>
                      )}

                      {c.political_effects.party_loyalty !== undefined && (
                        <span className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                          c.political_effects.party_loyalty > 0 
                            ? 'bg-amber-950/60 border-amber-500/40 text-amber-400' 
                            : c.political_effects.party_loyalty < 0
                            ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                            : 'bg-stone-800/60 border-stone-700 text-stone-400'
                        }`}>
                          <span>Whip Loyalty</span>
                          <span className="font-bold">{c.political_effects.party_loyalty > 0 ? '▲' : c.political_effects.party_loyalty < 0 ? '▼' : '▬'}</span>
                        </span>
                      )}

                      {c.political_effects.war_chest !== undefined && (
                        <span className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                          c.political_effects.war_chest > 0 
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                            : c.political_effects.war_chest < 0
                            ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                            : 'bg-stone-800/60 border-stone-700 text-stone-400'
                        }`}>
                          <span>War Chest</span>
                          <span className="font-bold">{c.political_effects.war_chest > 0 ? '▲' : c.political_effects.war_chest < 0 ? '▼' : '▬'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="text-xs text-stone-500 font-sans">
            Choice will immediately impact constituent polling and party standing.
          </div>

          <button
            onClick={() => onResolve(chosen)}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center space-x-2"
          >
            <span>Execute Decision Option {selectedOption}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
