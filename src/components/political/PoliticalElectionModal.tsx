import React from 'react';
import { Vote, Award, ShieldAlert, CheckCircle2, ArrowRight, Star, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface Props {
  result: {
    won: boolean;
    vote_share_pct: number;
    opponent_vote_share: number;
    message: string;
    target_office_id?: string;
    target_title?: string;
    is_higher_office?: boolean;
    breakdown?: {
      polling_score: number;
      last_election_score: number;
      approval_score: number;
      terms_score: number;
      achievement_score: number;
      fund_score: number;
      macro_score: number;
      ethics_score: number;
    };
    metrics?: {
      terms_served: number;
      min_terms_recommended: number;
      aggregate_achievement_score: number;
      target_achievement_score: number;
      war_chest_millions: number;
      target_war_chest: number;
    };
  };
  onClose: () => void;
}

export const PoliticalElectionModal: React.FC<Props> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md font-sans animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-center p-8 my-6">
        
        {/* Crest */}
        <div className={`w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center mb-6 shadow-xl ${
          result.won 
            ? 'bg-amber-950/80 border-amber-500 text-amber-400' 
            : 'bg-red-950/80 border-red-500 text-red-400'
        }`}>
          {result.won ? <Award className="w-10 h-10 animate-bounce" /> : <ShieldAlert className="w-10 h-10" />}
        </div>

        <div className="text-xs font-bold font-mono uppercase tracking-widest text-amber-400 mb-1">
          {result.is_higher_office ? 'Higher Office General Election' : 'General Election Division Results'}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-100 mb-2">
          {result.won 
            ? (result.is_higher_office ? `Elected ${result.target_title || 'Higher Office'}!` : 'Mandate Renewed in Victory!') 
            : 'Election Night Defeat'}
        </h2>

        {result.target_title && (
          <div className="text-xs font-mono text-stone-400 mb-4">
            Contested Office: <strong className="text-stone-200">{result.target_title}</strong>
          </div>
        )}

        {/* Voting Returns Card */}
        <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 mb-5 space-y-4">
          <div className="flex items-center justify-around">
            <div>
              <div className="text-xs text-stone-500 uppercase font-bold">Your Campaign</div>
              <div className="text-4xl font-bold font-mono text-emerald-400">{result.vote_share_pct}%</div>
            </div>
            <div className="text-stone-600 font-mono text-xl">vs</div>
            <div>
              <div className="text-xs text-stone-500 uppercase font-bold">Opposition Challenger</div>
              <div className="text-4xl font-bold font-mono text-red-400">{result.opponent_vote_share}%</div>
            </div>
          </div>

          <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-700" 
              style={{ width: `${result.vote_share_pct}%` }} 
            />
            <div 
              className="bg-red-500 h-full transition-all duration-700" 
              style={{ width: `${result.opponent_vote_share}%` }} 
            />
          </div>
        </div>

        {/* Breakdown Factors Pill Grid */}
        {result.breakdown && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-stone-950/80 border border-stone-800/80 text-[11px] font-mono mb-5 text-left">
            <div className="p-2 rounded-lg bg-stone-900">
              <span className="text-stone-500 block text-[9px] uppercase">Polling Margin</span>
              <span className={`font-bold ${result.breakdown.polling_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.breakdown.polling_score >= 0 ? '+' : ''}{result.breakdown.polling_score}%
              </span>
            </div>

            <div className="p-2 rounded-lg bg-stone-900">
              <span className="text-stone-500 block text-[9px] uppercase">Bills Achievement</span>
              <span className={`font-bold ${result.breakdown.achievement_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.breakdown.achievement_score >= 0 ? '+' : ''}{result.breakdown.achievement_score}%
              </span>
            </div>

            <div className="p-2 rounded-lg bg-stone-900">
              <span className="text-stone-500 block text-[9px] uppercase">Terms in Office</span>
              <span className={`font-bold ${result.breakdown.terms_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.breakdown.terms_score >= 0 ? '+' : ''}{result.breakdown.terms_score}%
              </span>
            </div>
          </div>
        )}

        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6 font-sans">
          {result.message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>{result.won ? (result.is_higher_office ? `Assume Office as ${result.target_title || 'Leader'}` : 'Begin New Legislative Term') : 'Review Campaign Post-Mortem'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
