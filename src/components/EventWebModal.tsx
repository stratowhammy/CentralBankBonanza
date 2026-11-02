import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { EventCatalogItem } from '../types';
import { X, Globe, Search, Filter, ArrowRight, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface EventWebModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventWebModal: React.FC<EventWebModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<EventCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPolarity, setFilterPolarity] = useState<'All' | 'Positive' | 'Negative'>('All');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventCatalogItem | null>(null);

  useEffect(() => {
    if (isOpen && events.length === 0) {
      setLoading(true);
      api.getEventsCatalog()
        .then(res => {
          setEvents(res.events || []);
          if (res.events && res.events.length > 0) {
            setSelectedEvent(res.events[0]);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, events.length]);

  if (!isOpen) return null;

  const filteredEvents = events.filter(e => {
    if (filterPolarity !== 'All' && e.polarity !== filterPolarity) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-prestige text-xl font-bold text-slate-100">
                50 Backwards-Planned Macroeconomic Events
              </h2>
              <p className="text-xs text-slate-400">
                25 Positive & 25 Negative Events with Multi-Tier Causal Precursor Trees
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-800 text-xs">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 font-semibold">
            {(['All', 'Positive', 'Negative'] as const).map(pol => (
              <button
                key={pol}
                onClick={() => setFilterPolarity(pol)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterPolarity === pol
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pol} ({events.filter(e => pol === 'All' ? true : e.polarity === pol).length})
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, keyword..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Main Content: Left List & Right Detail */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 overflow-hidden">
          
          {/* Left Column: Event List (5 cols) */}
          <div className="md:col-span-5 overflow-y-auto space-y-2 pr-1">
            {filteredEvents.map(e => {
              const isSelected = selectedEvent?.id === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-400">{e.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                      e.polarity === 'Positive'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}>
                      {e.polarity} • {e.impact_min}-{e.impact_max}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs line-clamp-1">{e.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{e.category}</p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Event Backwards-Planned Causal Tree (7 cols) */}
          <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-y-auto">
            {selectedEvent ? (
              <div className="space-y-4">
                
                {/* Event Title Banner */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-amber-400">{selectedEvent.id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{selectedEvent.category}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Impact: {selectedEvent.impact_min}–{selectedEvent.impact_max}/100 ({selectedEvent.impact_tier})
                    </span>
                  </div>

                  <h3 className="font-serif-headline text-xl font-bold text-slate-100">
                    {selectedEvent.name}
                  </h3>

                  <p className="text-xs text-slate-300 font-editorial mt-1 leading-relaxed">
                    {selectedEvent.summary}
                  </p>
                </div>

                <div className="h-px bg-slate-800"></div>

                {/* Backwards Causal Tree */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Backwards-Planned Causal Precursors</span>
                  </h4>

                  <div className="space-y-3.5">
                    {selectedEvent.contributing_factors.map((cf, idx) => (
                      <div key={cf.factor_id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-amber-400 font-bold">
                            Factor {idx + 1} [{cf.factor_id}]
                          </span>
                          <span className="font-bold text-slate-200 text-xs">
                            {cf.factor_name}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 italic mb-2">
                          Mechanism: {cf.mechanism}
                        </p>

                        {/* Sub-factors */}
                        <div className="space-y-1.5 pl-3 border-l-2 border-slate-800">
                          {cf.sub_factors.map(sf => (
                            <div key={sf.sub_factor_id} className="text-[11px]">
                              <span className="font-mono text-slate-400 font-semibold">{sf.sub_factor_id}: </span>
                              <strong className="text-slate-300">{sf.sub_factor_name}</strong>
                              <span className="text-slate-400"> — {sf.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                Select an event to inspect its backwards-planned causal tree.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
