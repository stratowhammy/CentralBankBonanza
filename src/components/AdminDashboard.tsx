import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { EventCatalogItem } from '../types';
import { 
  Sliders, 
  Zap, 
  Database, 
  Key, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Cpu, 
  Server,
  Layers,
  Volume2,
  VolumeX
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [eventsCatalog, setEventsCatalog] = useState<EventCatalogItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Shock Injector Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPolarity, setFilterPolarity] = useState<'All' | 'Positive' | 'Negative'>('All');
  const [selectedEventToInspect, setSelectedEventToInspect] = useState<EventCatalogItem | null>(null);
  const [injectingShock, setInjectingShock] = useState(false);
  const [shockMessage, setShockMessage] = useState<string | null>(null);

  // Economic Tweaker state
  const [tweakVariable, setTweakVariable] = useState('inflation_cpi');
  const [tweakValue, setTweakValue] = useState('5.5');
  const [tweaking, setTweaking] = useState(false);
  const [tweakMessage, setTweakMessage] = useState<string | null>(null);

  // Settings state
  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-v4-pro');
  const [llmProvider, setLlmProvider] = useState('local_macro_engine');
  
  // Google Cloud & Gemini 3.8 Flash TTS state
  const [googleTtsKey, setGoogleTtsKey] = useState('');
  const [googleTtsModel, setGoogleTtsModel] = useState('gemini-3.8-flash-tts');
  const [googleTtsVoice, setGoogleTtsVoice] = useState('Puck');

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, events] = await Promise.all([
        api.getAdminDashboard(),
        api.getEventsCatalog()
      ]);
      setDashboardData(dash);
      setEventsCatalog(events.events || []);

      if (dash.sessions && dash.sessions.length > 0) {
        if (!selectedSessionId || !dash.sessions.some((s: any) => s.id === selectedSessionId)) {
          setSelectedSessionId(dash.sessions[0].id);
        }
      }

      if (dash.settings) {
        setDeepseekKey(dash.settings.deepseek_api_key || '');
        setDeepseekModel(dash.settings.deepseek_model || 'deepseek-v4-pro');
        setLlmProvider(dash.settings.llm_provider || 'local_macro_engine');
        setGoogleTtsKey(dash.settings.google_tts_api_key || '');
        setGoogleTtsModel(dash.settings.google_tts_model || 'gemini-3.8-flash-tts');
        setGoogleTtsVoice(dash.settings.google_tts_voice || 'Puck');
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInjectShock = async (eventId: string) => {
    if (!selectedSessionId) {
      alert('Please select an active session first');
      return;
    }
    setInjectingShock(true);
    setShockMessage(null);
    try {
      const res = await api.injectShock(selectedSessionId, eventId);
      setShockMessage(`Successfully injected ${eventId} into session ${selectedSessionId}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Shock injection failed');
    } finally {
      setInjectingShock(false);
    }
  };

  const handleTweakEconomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    setTweaking(true);
    setTweakMessage(null);
    try {
      await api.tweakEconomy(selectedSessionId, tweakVariable, Number(tweakValue));
      setTweakMessage(`Variable '${tweakVariable}' set to ${tweakValue}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Tweak failed');
    } finally {
      setTweaking(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await api.updateSettings({
        deepseek_api_key: deepseekKey,
        deepseek_model: deepseekModel,
        llm_provider: llmProvider,
        google_tts_api_key: googleTtsKey,
        google_tts_model: googleTtsModel,
        google_tts_voice: googleTtsVoice
      });
      setSettingsMessage('Settings and Google Cloud TTS credentials saved successfully');
    } catch (err: any) {
      alert(err.message || 'Settings update failed');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter events catalog
  const filteredEvents = eventsCatalog.filter(e => {
    if (filterPolarity !== 'All' && e.polarity !== filterPolarity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedSession = dashboardData?.sessions?.find((s: any) => s.id === selectedSessionId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 android-scroll-bottom-clearance">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-prestige text-2xl font-bold text-slate-100">
                  Central Bank Command & Admin Desk
                </h1>
                <p className="text-xs text-slate-400 font-sans">
                  Live Economic State Tweaker, 50-Event Shock Injector & LLM Configuration
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Top Metric Cards */}
        {dashboardData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs block uppercase font-mono">Registered Users</span>
              <span className="font-data text-2xl font-bold text-slate-100">{dashboardData.stats.total_users}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs block uppercase font-mono">Total Game Careers</span>
              <span className="font-data text-2xl font-bold text-amber-400">{dashboardData.stats.total_sessions}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs block uppercase font-mono">Active Sessions</span>
              <span className="font-data text-2xl font-bold text-emerald-400">{dashboardData.stats.active_sessions}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs block uppercase font-mono">Catalogued Shocks</span>
              <span className="font-data text-2xl font-bold text-purple-400">{dashboardData.stats.total_event_catalog_size} Events</span>
            </div>
          </div>
        )}

        {/* Session Selector Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
                Target Game Session for Administration
              </span>
              <span className="text-xs text-slate-400">
                Choose a session to inspect indicators or inject custom macroeconomic shocks
              </span>
            </div>
          </div>

          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 max-w-md"
          >
            {dashboardData?.sessions?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.chair_name} ({s.play_mode}, {s.difficulty}) • Y{s.current_year} M{s.current_month} [Status: {s.status}]
              </option>
            ))}
          </select>
        </div>

        {/* Live Economic State Tweaker & Session Inspector */}
        {selectedSession && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Live Indicators Table */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-200">
                  Live State Inspector ({selectedSession.chair_name})
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Session: {selectedSession.id}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {Object.entries(selectedSession.economic_state).map(([k, v]) => {
                  if (typeof v === 'object') return null;
                  return (
                    <div key={k} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono block truncate" title={k}>
                        {k}
                      </span>
                      <span className="font-data font-bold text-sm text-slate-100">
                        {typeof v === 'number' ? (v as number).toFixed(2) : String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Live Tweaker Form */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-200 block mb-1">
                  Manual Variable Tweaker
                </span>
                <p className="text-xs text-slate-400 mb-4 font-sans">
                  Override any indicator on the fly to test how the game and news reports respond.
                </p>

                {tweakMessage && (
                  <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                    {tweakMessage}
                  </div>
                )}

                <form onSubmit={handleTweakEconomy} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Select Variable</label>
                    <select
                      value={tweakVariable}
                      onChange={(e) => setTweakVariable(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                    >
                      <option value="interest_rate">interest_rate (Policy %)</option>
                      <option value="inflation_cpi">inflation_cpi (Headline CPI %)</option>
                      <option value="core_inflation">core_inflation (Core CPI %)</option>
                      <option value="gdp_growth">gdp_growth (Real GDP %)</option>
                      <option value="unemployment_rate">unemployment_rate (Unemployment %)</option>
                      <option value="stock_market_index">stock_market_index (Doll Street Pts)</option>
                      <option value="bond_yield_10y">bond_yield_10y (10Y Yield %)</option>
                      <option value="bond_yield_2y">bond_yield_2y (2Y Yield %)</option>
                      <option value="real_wage_growth">real_wage_growth (Wage Gap %)</option>
                      <option value="housing_cost_index">housing_cost_index (Shelter Idx)</option>
                      <option value="consumer_confidence">consumer_confidence (0..100)</option>
                      <option value="parliamentary_approval">parliamentary_approval (0..100)</option>
                      <option value="public_approval">public_approval (0..100)</option>
                      <option value="job_security">job_security (First Person %)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">New Numerical Value</label>
                    <input
                      type="number"
                      step="any"
                      value={tweakValue}
                      onChange={(e) => setTweakValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={tweaking}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {tweaking ? 'Updating State...' : 'Apply Instant State Tweak'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* 50-Event Shock Injector Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="font-prestige font-bold text-lg text-slate-100">
                  Macroeconomic Shock Injector (50 Backwards-Planned Events)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Select any event from the 50-event web to inject into the selected active game session.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
                {(['All', 'Positive', 'Negative'] as const).map(pol => (
                  <button
                    key={pol}
                    onClick={() => setFilterPolarity(pol)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filterPolarity === pol
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pol}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 50 events..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          {shockMessage && (
            <div className="p-3.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between">
              <span>{shockMessage}</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
          )}

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredEvents.map(evt => (
              <div
                key={evt.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400">{evt.id}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      evt.polarity === 'Positive'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {evt.polarity} • {evt.impact_tier}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 leading-snug mb-1">
                    {evt.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {evt.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Impact: {evt.impact_min}-{evt.impact_max}/100
                  </span>
                  <button
                    onClick={() => handleInjectShock(evt.id)}
                    disabled={injectingShock}
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Inject Shock</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Settings & LLM Configuration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="font-prestige font-bold text-base text-slate-100">
                  DeepSeek Flash & AI Generation Settings
                </h3>
              </div>

              {settingsMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                  {settingsMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    DeepSeek API Key
                  </label>
                  <input
                    type="password"
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder:text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Leave blank to use the built-in local macroeconomic narrative engine.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    DeepSeek Model Designation
                  </label>
                  <input
                    type="text"
                    value={deepseekModel}
                    onChange={(e) => setDeepseekModel(e.target.value)}
                    placeholder="deepseek-v4-pro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Default: deepseek-v4-pro (Thinking / Extended Reasoning Enabled)
                  </span>
                </div>
              </div>
            </div>

            {/* Google Cloud & Gemini 3.8 Flash TTS Configuration */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-prestige font-bold text-base text-slate-100">
                      Google Cloud & Gemini 3.8 Flash Text-to-Speech (TTS)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      High-fidelity spoken audio narration for newspaper dispatches and the Chief of Staff in both CBS and Statecraft
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono border ${
                  googleTtsKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {googleTtsKey ? '● Cloud / Gemini TTS Ready' : '○ Local Web Speech Fallback'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Google Cloud / Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={googleTtsKey}
                    onChange={(e) => setGoogleTtsKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-400 placeholder:text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Google Cloud or Gemini API key. If unset, the browser's native speech synthesis engine is utilized seamlessly.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Gemini TTS Model
                  </label>
                  <input
                    type="text"
                    value={googleTtsModel}
                    onChange={(e) => setGoogleTtsModel(e.target.value)}
                    placeholder="gemini-3.8-flash-tts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Default: gemini-3.8-flash-tts (Google Gemini Audio Modality)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Default TTS Voice Persona
                  </label>
                  <select
                    value={googleTtsVoice}
                    onChange={(e) => setGoogleTtsVoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Puck">Puck (Energetic, engaging, standard news)</option>
                    <option value="Charon">Charon (Deep, measured, macroeconomic analysis)</option>
                    <option value="Fenrir">Fenrir (Authoritative, Chief of Staff advisor)</option>
                    <option value="Aoede">Aoede (Clear, crisp, fast financial wire)</option>
                    <option value="Kore">Kore (Dignified, parliamentary, legislative)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Role-adaptive voices will modulate based on newspaper or advisor context.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2"
              >
                {savingSettings ? 'Saving Configuration...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
