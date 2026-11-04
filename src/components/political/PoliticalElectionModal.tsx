import React from 'react';
import { Vote, Award, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  result: {
    won: boolean;
    vote_share_pct: number;
    opponent_vote_share: number;
    message: string;
  };
  onClose: () => void;
}

export const PoliticalElectionModal: React.FC<Props> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md font-sans animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-center p-8">
        
        {/* Crest */}
        <div className={`w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center mb-6 shadow-xl ${
          result.won 
            ? 'bg-amber-950/80 border-amber-500 text-amber-400' 
            : 'bg-red-950/80 border-red-500 text-red-400'
        }`}>
          {result.won ? <Award className="w-10 h-10 animate-bounce" /> : <ShieldAlert className="w-10 h-10" />}
        </div>

        <div className="text-xs font-bold font-mono uppercase tracking-widest text-amber-400 mb-2">
          General Election Division Results
        </div>

        <h2 className="text-3xl font-bold font-serif text-stone-100 mb-4">
          {result.won ? 'Re-Election Mandate Secured!' : 'Election Night Defeat'}
        </h2>

        {/* Voting Returns Card */}
        <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 mb-6 space-y-4">
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

        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6 font-sans">
          {result.message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>{result.won ? 'Begin New Legislative Term' : 'Review Campaign Post-Mortem'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
