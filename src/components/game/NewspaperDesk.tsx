import React, { useState } from 'react';
import { NewsArticle, PublisherType } from '../../types';
import { Newspaper, BookOpen, Quote } from 'lucide-react';

interface NewspaperDeskProps {
  articles: NewsArticle[];
  currentYear: number;
  currentMonth: number;
}

const PUBLISHER_THEMES: Record<PublisherType, {
  name: string;
  masthead: string;
  tagline: string;
  accentBg: string;
  accentText: string;
  border: string;
  headerFont: string;
}> = {
  gloomberg: {
    name: 'Gloomberg News',
    masthead: 'GLOOMBERG',
    tagline: 'The Global Macro & Fixed Income Authority',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    border: 'border-amber-500/30',
    headerFont: 'font-mono'
  },
  doll_street: {
    name: 'The Doll Street Journal',
    masthead: 'THE DOLL STREET JOURNAL.',
    tagline: 'Capitalist Chronicle • Markets • Mergers • Free Enterprise',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-400',
    border: 'border-emerald-500/30',
    headerFont: 'font-serif-headline'
  },
  gotham: {
    name: 'Gotham News Tribune',
    tagline: 'The People\'s Voice • Living Costs • Labor • Metro Realities',
    masthead: 'Gotham News Tribune',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-400',
    border: 'border-blue-500/30',
    headerFont: 'font-editorial'
  },
  cashington: {
    name: 'The Cashington Post',
    masthead: 'The Cashington Post',
    tagline: 'Inside Parliament • Coalition Manoeuvres • Fiscal Wars',
    accentBg: 'bg-purple-500/10',
    accentText: 'text-purple-400',
    border: 'border-purple-500/30',
    headerFont: 'font-prestige'
  }
};

export const NewspaperDesk: React.FC<NewspaperDeskProps> = ({ articles, currentYear, currentMonth }) => {
  const [selectedPublisher, setSelectedPublisher] = useState<PublisherType>(
    articles.length > 0 ? articles[0].publisher : 'gloomberg'
  );

  const activeArticle = articles.find(a => a.publisher === selectedPublisher) || articles[0];
  const theme = activeArticle ? PUBLISHER_THEMES[activeArticle.publisher] : PUBLISHER_THEMES.gloomberg;

  const wordCount = activeArticle ? activeArticle.body.split(/\s+/).filter(Boolean).length : 0;
  const paragraphs = activeArticle ? activeArticle.body.split('\n\n') : [];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      
      {/* Newspaper Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-amber-400" />
          <span className="font-prestige text-sm font-bold text-slate-100 uppercase tracking-wider">
            Monthly Press Dispatch
          </span>
          <span className="text-xs text-slate-500 font-mono">
            (Year {currentYear}, Month {currentMonth})
          </span>
        </div>

        {/* Paper Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          {articles.map((art) => {
            const pTheme = PUBLISHER_THEMES[art.publisher];
            const isSelected = selectedPublisher === art.publisher;
            return (
              <button
                key={art.publisher}
                onClick={() => setSelectedPublisher(art.publisher)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? `${pTheme.accentBg} ${pTheme.accentText} border ${pTheme.border} shadow-sm`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{pTheme.name}</span>
                {art.urgency === 'critical' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Article Showcase */}
      {activeArticle ? (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-6 sm:p-8 relative">
          
          {/* Top Paper Header / Masthead */}
          <div className="text-center pb-5 mb-6 border-b-2 border-slate-800/80">
            <h2 className={`${theme.headerFont} text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 uppercase`}>
              {theme.masthead}
            </h2>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 italic mt-1 font-editorial">
              <span>{theme.tagline}</span>
              <span>•</span>
              <span>Published: Year {currentYear}, Month {currentMonth}</span>
              <span>•</span>
              <span className="font-mono text-slate-500">{wordCount} words</span>
            </div>
          </div>

          {/* Tone, Urgency & Byline Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Editorial Stance:
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                activeArticle.tone === 'hawkish'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  : (activeArticle.tone === 'dovish'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : (activeArticle.tone === 'alarmist'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'))
              }`}>
                {activeArticle.tone}
              </span>

              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                activeArticle.urgency === 'critical'
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/50'
                  : (activeArticle.urgency === 'high'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700')
              }`}>
                Urgency: {activeArticle.urgency}
              </span>
            </div>

            <div className="text-xs text-slate-400 italic">
              {activeArticle.byline || 'By Staff Macro Correspondent'}
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-serif-headline text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 leading-tight mb-4">
            {activeArticle.headline}
          </h1>

          {/* Trader Gossip / Street Reaction Callout */}
          {activeArticle.whisper_quote && (
            <div className="my-5 p-4 rounded-xl bg-slate-900/90 border-l-4 border-amber-400 border-slate-800 shadow-md">
              <div className="text-[11px] uppercase font-mono tracking-wider text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" /> Trader Gossip & Hallway Whisper
              </div>
              <div className="font-serif italic text-sm text-slate-200">
                {activeArticle.whisper_quote}
              </div>
            </div>
          )}

          {/* Article Body - Multi-paragraph with dateline */}
          <div className="font-editorial text-base sm:text-lg text-slate-200 leading-relaxed space-y-4 max-w-none border-l-2 border-slate-800 pl-4 sm:pl-6">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx} className="first-letter:text-3xl first-letter:font-bold first-letter:text-amber-400 first-letter:float-left first-letter:mr-2">
                {idx === 0 && activeArticle.dateline && (
                  <strong className="font-mono text-xs uppercase tracking-wider text-amber-300 mr-2 not-italic">
                    [{activeArticle.dateline}] —
                  </strong>
                )}
                {paragraph}
              </p>
            ))}
          </div>

          {/* Bottom Central Banker Assessment Footer */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 gap-2">
            <span className="italic">
              Note: This report provides economic facts, sentiment, and stakeholder quotes. The central banker must assess severity independently.
            </span>
            <div className="flex items-center gap-1.5 text-amber-400 font-medium font-sans">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Text Dispatched</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 italic">
          No dispatches received for this month.
        </div>
      )}

    </div>
  );
};
