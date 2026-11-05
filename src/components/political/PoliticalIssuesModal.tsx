import React, { useState } from 'react';
import { PoliticalSession, MajorNationalIssue } from '../../types';
import { 
  Globe2, ShieldAlert, Award, X, Sparkles, Scale, AlertTriangle, 
  Flame, TrendingUp, CheckCircle2, Building2, Users 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: PoliticalSession;
}

export const PoliticalIssuesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  session
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'social' | 'geopolitical' | 'economic' | 'national_political'>('all');

  if (!isOpen) return null;

  const issues: MajorNationalIssue[] = session.major_issues || [];
  const playerCaucusId = session.political_state?.player_caucus_id;
  const playerCaucusName = session.political_state?.player_caucus_name;

  const filtered = selectedCategory === 'all' 
    ? issues 
    : issues.filter(i => i.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100 font-serif">
                National Issues Landscape & Pressing Agendas
              </h2>
              <p className="text-xs text-amber-400/90 font-mono">
                Social Dynamics • Geopolitical Imperatives • Macroeconomic Friction • Corruption & Civic Integrity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-4 text-xs font-mono">
            {[
              { id: 'all', label: 'All Major Issues' },
              { id: 'social', label: 'Social & Domestic' },
              { id: 'geopolitical', label: 'Geopolitical & Trade' },
              { id: 'economic', label: 'Economic & Fiscal' },
              { id: 'national_political', label: 'National Politics & Corruption' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl border font-bold transition-all ${
                  selectedCategory === tab.id
                    ? 'border-amber-500 bg-amber-950/50 text-amber-300 ring-1 ring-amber-500'
                    : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Issues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(issue => {
              const isCorruption = issue.attribute_type === 'corruption_concern';
              const isScandal = issue.attribute_type === 'scandal_risk';
              const isCivicVirtue = issue.attribute_type === 'civic_strength';
              const playerStance = playerCaucusId ? issue.caucus_stances?.[playerCaucusId] : null;

              return (
                <div
                  key={issue.id}
                  className={`p-5 rounded-2xl bg-stone-950 border transition-all flex flex-col justify-between space-y-3 ${
                    isCorruption || isScandal
                      ? 'border-rose-900/60 hover:border-rose-600/70'
                      : isCivicVirtue
                      ? 'border-emerald-900/60 hover:border-emerald-600/70'
                      : 'border-stone-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-2">
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                        isCorruption || isScandal
                          ? 'bg-rose-950/70 border-rose-800/40 text-rose-300'
                          : isCivicVirtue
                          ? 'bg-emerald-950/70 border-emerald-800/40 text-emerald-300'
                          : 'bg-stone-900 border-stone-800 text-amber-300'
                      }`}>
                        {issue.category.replace('_', ' ')} {isCorruption ? '• Corruption' : isScandal ? '• Scandal' : isCivicVirtue ? '• Civic Virtue' : ''}
                      </span>

                      <div className="flex items-center space-x-1.5 text-[11px] font-mono">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-stone-300">Salience: {issue.salience}%</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-base text-stone-100 font-serif">
                      {issue.title}
                    </h4>

                    <p className="text-xs text-stone-400 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {/* Salience Bar & Stances */}
                  <div className="space-y-2 pt-2 border-t border-stone-850 text-xs">
                    <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          issue.salience > 80 ? 'bg-amber-500' : 'bg-stone-500'
                        }`}
                        style={{ width: `${issue.salience}%` }}
                      />
                    </div>

                    {/* Stance from Player's Caucus */}
                    {playerStance && playerCaucusName && (
                      <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                        <span className="text-stone-400">Your Caucus ({playerCaucusName}):</span>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                          playerStance === 'champion'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                            : playerStance === 'oppose'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        }`}>
                          {playerStance}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
