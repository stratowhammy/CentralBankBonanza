import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, ShieldAlert, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PoliticalEventWebModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [filterPolarity, setFilterPolarity] = useState<'All' | 'Positive' | 'Negative'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    // Fetch political events catalog from API
    fetch('/api/political/events-catalog')
      .then(r => r.json())
      .then(data => {
        if (data && data.events) {
          setEvents(data.events);
          setSelectedEvent(data.events[0]);
        }
      })
      .catch(() => {
        fetch('/political_event_web.json')
          .then(r => r.json())
          .then(data => {
            if (data && data.events) {
              setEvents(data.events);
              setSelectedEvent(data.events[0]);
            }
          })
          .catch(() => {});
      });
  }, []);

  if (!isOpen) return null;

  const filtered = events.filter(e => {
    const matchesPolarity = filterPolarity === 'All' || e.polarity === filterPolarity;
    const matchesSearch = !searchTerm || 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPolarity && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans animate-fade-in">
      <div className="relative w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 font-serif">Statecraft 50-Event Causal Web & Decision Tree</h3>
              <p className="text-xs text-stone-400 font-sans">
                50 Macroeconomic & Political Events • 25 Positive • 25 Negative • 150 Strategic Choices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3 border-b border-stone-800 bg-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Polarity Pills */}
          <div className="flex rounded-lg border border-stone-800 bg-stone-950 p-0.5">
            {(['All', 'Positive', 'Negative'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPolarity(p)}
                className={`px-4 py-1.5 rounded-md font-bold transition-colors ${
                  filterPolarity === p
                    ? p === 'Positive' ? 'bg-emerald-600 text-stone-950' : p === 'Negative' ? 'bg-red-600 text-stone-950' : 'bg-amber-600 text-stone-950'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {p} ({p === 'All' ? events.length : events.filter(e => e.polarity === p).length})
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by topic, keyword, category..."
              className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
            />
          </div>
        </div>

        {/* Master-Detail Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Event List */}
          <div className="w-full md:w-2/5 border-r border-stone-800 overflow-y-auto divide-y divide-stone-800/60 bg-stone-950/40">
            {filtered.map(ev => {
              const isSelected = selectedEvent?.id === ev.id;
              const isPos = ev.polarity === 'Positive';
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-950/30 border-l-4 border-amber-500' : 'hover:bg-stone-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-stone-500 font-bold">{ev.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isPos ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400' : 'bg-red-950/50 border-red-800 text-red-400'
                    }`}>
                      {ev.polarity} • {ev.impact_tier}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-stone-200 leading-snug mb-1">{ev.name}</h4>
                  <p className="text-xs text-stone-400 line-clamp-2">{ev.summary}</p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Event Details */}
          <div className="flex-1 overflow-y-auto p-6 bg-stone-900/90 space-y-6">
            {selectedEvent ? (
              <div className="space-y-6 animate-fade-in">
                
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 uppercase font-bold mb-1">
                    <span>{selectedEvent.id}</span>
                    <span>•</span>
                    <span>{selectedEvent.category}</span>
                    <span>•</span>
                    <span>Tier: {selectedEvent.impact_tier} ({selectedEvent.impact_min}-{selectedEvent.impact_max})</span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-stone-100 mb-3">{selectedEvent.name}</h2>
                  <p className="text-sm text-stone-300 leading-relaxed p-4 rounded-2xl bg-stone-950 border border-stone-800">
                    {selectedEvent.summary}
                  </p>
                </div>

                {/* Contributing Causal Factors */}
                {selectedEvent.contributing_factors && selectedEvent.contributing_factors.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                      Contributing Causal Factors & Mechanisms
                    </h4>
                    <div className="space-y-3">
                      {selectedEvent.contributing_factors.map((cf: any) => (
                        <div key={cf.factor_id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                          <div className="font-bold text-stone-200 mb-1">{cf.factor_name}</div>
                          <p className="text-stone-400 leading-normal">{cf.mechanism}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Strategic Choices */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                    Available Strategic Choices & Political Trade-offs
                  </h4>
                  <div className="space-y-3">
                    {selectedEvent.choices?.map((c: any) => (
                      <div key={c.option_id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-amber-600 text-stone-950 font-bold font-mono text-xs flex items-center justify-center">
                            {c.option_id}
                          </span>
                          <span className="font-bold text-sm text-stone-100">{c.label}</span>
                        </div>
                        <p className="text-xs text-stone-400 pl-7">{c.description}</p>
                        
                        <div className="pl-7 flex flex-wrap gap-2 text-[10px] font-sans font-medium pt-1">
                          {c.political_effects?.district_approval !== undefined && (
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
                          {c.political_effects?.national_approval !== undefined && (
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
                          {c.political_effects?.party_loyalty !== undefined && (
                            <span className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                              c.political_effects.party_loyalty > 0 
                                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400' 
                                : c.political_effects.party_loyalty < 0
                                ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                                : 'bg-stone-800/60 border-stone-700 text-stone-400'
                            }`}>
                              <span>Party Whip</span>
                              <span className="font-bold">{c.political_effects.party_loyalty > 0 ? '▲' : c.political_effects.party_loyalty < 0 ? '▼' : '▬'}</span>
                            </span>
                          )}
                          {c.political_effects?.war_chest !== undefined && (
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
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500 text-xs">
                Select an event from the catalog to view its causal mechanisms and decision options.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
