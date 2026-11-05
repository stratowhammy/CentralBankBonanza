import React, { useState, useEffect } from 'react';
import { PoliticalSystemType, PoliticalSession, User } from '../../types';
import { api } from '../../api';
import { 
  Landmark, Scale, Users, Shield, Award, Sparkles, Building2, Vote, 
  ArrowRight, Play, Trash2, UserCircle, LogOut, Flame, Globe2, AlertTriangle, CheckCircle2
} from 'lucide-react';

interface Props {
  user: User | null;
  onStartCareer: (params: {
    politician_name: string;
    system_type: PoliticalSystemType;
    selected_track?: string;
    party_name: string;
    district_name: string;
    linked_cbs_session_id?: string;
    economy_type?: string;
    starting_condition?: string;
    volatility?: string;
  }) => void;
  onResumeCareer: (session: PoliticalSession) => void;
  onSwitchToCbs: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const PoliticalLanding: React.FC<Props> = ({ 
  user, 
  onStartCareer, 
  onResumeCareer, 
  onSwitchToCbs, 
  onOpenAuth, 
  onLogout 
}) => {
  const [systemType, setSystemType] = useState<PoliticalSystemType>('parliamentary');
  const [politicianName, setPoliticianName] = useState('Eleanor Vance');
  const [selectedTrack, setSelectedTrack] = useState('backbencher');
  const [partyName, setPartyName] = useState('Democratic Alliance');
  const [districtName, setDistrictName] = useState('Highland Greenshire');
  const [linkedCbsSessionId, setLinkedCbsSessionId] = useState('');
  
  // Starting Conditions
  const [economyType, setEconomyType] = useState<'large_hegemon' | 'middle_advanced' | 'small_emerging'>('large_hegemon');
  const [startingCondition, setStartingCondition] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [volatility, setVolatility] = useState<'low' | 'normal' | 'high' | 'extreme'>('normal');

  // User's Saved Careers
  const [savedSessions, setSavedSessions] = useState<PoliticalSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const isRegistered = user && user.username !== 'guest';

  // Load user's saved sessions
  const loadSavedCareers = () => {
    if (isRegistered && user) {
      setLoadingSessions(true);
      api.getPoliticalSessions(user.id)
        .then(res => {
          setSavedSessions(res.sessions || []);
        })
        .catch(err => {
          console.warn('Could not load saved political sessions:', err.message);
        })
        .finally(() => setLoadingSessions(false));
    } else {
      setSavedSessions([]);
    }
  };

  useEffect(() => {
    loadSavedCareers();
  }, [user]);

  // Check if there is an active Central Bank session in localStorage for optional tandem linking
  useEffect(() => {
    const cbsId = localStorage.getItem('cbb_session_id');
    if (cbsId) {
      setLinkedCbsSessionId(cbsId);
    }
  }, []);

  // Update starter defaults when switching system type
  const handleSystemChange = (sys: PoliticalSystemType) => {
    setSystemType(sys);
    if (sys === 'parliamentary') {
      setSelectedTrack('backbencher');
      setPartyName('Democratic Alliance');
      setDistrictName('Highland Greenshire');
      if (politicianName.includes('Representative')) setPoliticianName('Eleanor Vance MP');
    } else {
      setSelectedTrack('representative');
      setPartyName('Democratic Alliance');
      setDistrictName('Metro-Industrial 4th Congressional District');
      if (politicianName.includes('MP')) setPoliticianName('Representative Marcus Vance');
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to retire and permanently delete this political career?')) {
      return;
    }
    setIsDeletingId(sessionId);
    try {
      await api.deletePoliticalSession(sessionId);
      setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
      if (localStorage.getItem('ps_session_id') === sessionId) {
        localStorage.removeItem('ps_session_id');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete political career');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegistered) {
      if (onOpenAuth) onOpenAuth();
      alert('Registration required. Please sign in or create an account to start a political simulation.');
      return;
    }

    if (!politicianName.trim()) {
      alert('Please enter your politician name');
      return;
    }

    onStartCareer({
      politician_name: politicianName.trim(),
      system_type: systemType,
      selected_track: selectedTrack,
      party_name: partyName,
      district_name: districtName.trim() || 'General District',
      linked_cbs_session_id: linkedCbsSessionId.trim() || undefined,
      economy_type: economyType,
      starting_condition: startingCondition,
      volatility: volatility
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-serif selection:bg-amber-900 selection:text-amber-100">
      
      {/* Top Banner / Chamber Crest */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-red-950 border border-amber-600/40 flex items-center justify-center text-amber-400 shadow-md">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-amber-200 uppercase font-sans">Statecraft: The Political Simulator</h1>
            <p className="text-xs text-stone-400 font-sans">Executive & Legislative Strategy Engine • Port: ~/ps</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* User Auth Status Pill */}
          {isRegistered ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-sans">
              <div className="w-6 h-6 rounded-full bg-amber-950 border border-amber-600/50 flex items-center justify-center font-bold text-amber-400 text-[11px]">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-stone-300 font-medium max-w-[110px] truncate">{user.display_name}</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 text-stone-500 hover:text-stone-300 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 text-xs font-sans font-bold uppercase rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )
          )}

          <button
            onClick={onSwitchToCbs}
            className="px-4 py-2 text-xs font-sans font-bold uppercase rounded-lg border border-amber-500/40 bg-stone-800 hover:bg-stone-700 text-amber-300 transition-colors flex items-center space-x-2"
          >
            <span>Central Bank Sim (~/cbs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero & Career Form */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-10">
        
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-300 text-xs font-sans mb-3">
            <Vote className="w-3.5 h-3.5" />
            <span>National Power, Legislative Battles & Re-Election Survival</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-100 mb-4 font-serif">
            Ascend the Halls of Statecraft
          </h2>
          <p className="text-sm sm:text-base text-stone-400 font-sans leading-relaxed">
            Navigate the volatile crosscurrents of national politics. Balance constituent bread-and-butter anxieties against 
            ruthless party whips, donor PACs, and live macroeconomic events. Author landmark statutes, survive elections, 
            and advance to the highest executive offices in the land.
          </p>
        </div>

        {/* Unregistered Alert Banner */}
        {!isRegistered && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-200">Account Registration Required</p>
                <p className="text-stone-300">
                  Unregistered visitors cannot start or advance simulations. Sign in or register to launch your career.
                </p>
              </div>
            </div>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl whitespace-nowrap shadow-md uppercase tracking-wider text-[11px]"
              >
                Sign In / Register
              </button>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* CAREERS HUB: Saved Simulations Deck                           */}
        {/* ============================================================== */}
        {isRegistered && savedSessions.length > 0 && (
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-100 font-serif">Your Saved Political Careers</h3>
                  <p className="text-xs text-stone-400 font-sans">Resume active legislative sessions or manage previous tenures</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-stone-950 border border-stone-800 text-amber-400">
                {savedSessions.length} Career{savedSessions.length > 1 ? 's' : ''} Saved
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedSessions.map(sess => {
                const p = sess.political_state;
                return (
                  <div
                    key={sess.id}
                    className="p-5 rounded-xl border border-stone-800 bg-stone-950/70 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                            {sess.system_type === 'parliamentary' ? 'Parliament' : 'Congress'} • Y{sess.current_year} M{sess.current_month}
                          </span>
                          <h4 className="font-bold text-base text-stone-100 font-serif mt-1.5">
                            {p.politician_title || sess.politician_name} {sess.politician_name}
                          </h4>
                          <p className="text-xs text-stone-400 font-sans">
                            {sess.party_name} • {sess.district_name}
                          </p>
                        </div>

                        <button
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          disabled={isDeletingId === sess.id}
                          className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete / Retire Career"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Key Career Metrics */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-850 font-sans text-center">
                        <div>
                          <span className="text-[10px] uppercase text-stone-400 block">Approval</span>
                          <span className={`text-xs font-bold ${Number(p.district_approval || 50) >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.district_approval || 50}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-stone-400 block">War Chest</span>
                          <span className="text-xs font-bold text-amber-300 font-mono">
                            ${p.war_chest_millions || 2.5}M
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-stone-400 block">Passed Bills</span>
                          <span className="text-xs font-bold text-stone-200">
                            {p.bills_passed || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onResumeCareer(sess)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-98"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Career / Enter Simulation</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* NEW CAREER CONFIGURATION CARD                                  */}
        {/* ============================================================== */}
        <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
          
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-xl font-bold font-serif text-amber-200">➕ Inaugurate a New Political Career</h3>
            <p className="text-xs text-stone-400 font-sans mt-1">Configure constitutional structure, starting conditions, and district mandate</p>
          </div>

          {/* 1. Political System Selection */}
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-amber-400 mb-3">
              1. Choose Constitutional System
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => handleSystemChange('parliamentary')}
                className={`cursor-pointer p-5 rounded-xl border transition-all ${
                  systemType === 'parliamentary' 
                    ? 'border-amber-500 bg-amber-950/20 text-stone-100 ring-1 ring-amber-500' 
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-amber-200">Parliamentary (Westminster)</h3>
                </div>
                <p className="text-xs text-stone-400 font-sans leading-normal">
                  Progress from Backbench MP to Committee Chair, Cabinet Minister, and Prime Minister. 
                  Heavy emphasis on party whips, coalition stability, and Question Time scrutiny.
                </p>
              </div>

              <div 
                onClick={() => handleSystemChange('congressional')}
                className={`cursor-pointer p-5 rounded-xl border transition-all ${
                  systemType === 'congressional' 
                    ? 'border-amber-500 bg-amber-950/20 text-stone-100 ring-1 ring-amber-500' 
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-amber-200">Congressional / Presidential (US)</h3>
                </div>
                <p className="text-xs text-stone-400 font-sans leading-normal">
                  Progress from US House Representative to Committee Chair / Whip, US Senator, and President. 
                  High-stakes 2-year district cycles, Senate filibusters, and high-dollar PAC fundraising.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Starting Conditions (Size, Climate, Rapidity) */}
          <div className="space-y-6 pt-4 border-t border-stone-800">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-amber-400">
              2. Simulation Starting Conditions
            </h4>

            {/* Country Size */}
            <div>
              <label className="block text-xs font-sans font-medium text-stone-300 mb-2">
                Size of Country & Economic Sphere
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                {[
                  { id: 'large_hegemon', label: 'Continental Republic', desc: 'Large sovereign economy, global reserve currency status, vast federal budget.' },
                  { id: 'middle_advanced', label: 'Industrial Democracy', desc: 'Medium export-oriented economy sensitive to global capital flows and trade pacts.' },
                  { id: 'small_emerging', label: 'Small Sovereign Island', desc: 'Compact sovereign nation highly vulnerable to external inflation and rate shocks.' }
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEconomyType(opt.id as any)}
                    className={`cursor-pointer p-3.5 rounded-xl border text-xs transition-all ${
                      economyType === opt.id
                        ? 'border-amber-500 bg-amber-950/30 text-amber-200 ring-1 ring-amber-500'
                        : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{opt.label}</div>
                    <div className="text-[11px] text-stone-400 leading-snug">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Political Climate */}
            <div>
              <label className="block text-xs font-sans font-medium text-stone-300 mb-2">
                Starting Political Climate
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                {[
                  { id: 'easy', label: 'Consensus Mandate (Easy)', desc: '+10% initial public and district approval, cooperative floor whips, milder crises.' },
                  { id: 'normal', label: 'Standard Partisan Division (Normal)', desc: 'Balanced legislative floor with tight 52% baseline whip support.' },
                  { id: 'hard', label: 'Severe Polarization (Hard)', desc: '-10% initial approval, hostile oversight hearings, razor-thin floor divisions.' }
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setStartingCondition(opt.id as any)}
                    className={`cursor-pointer p-3.5 rounded-xl border text-xs transition-all ${
                      startingCondition === opt.id
                        ? 'border-amber-500 bg-amber-950/30 text-amber-200 ring-1 ring-amber-500'
                        : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{opt.label}</div>
                    <div className="text-[11px] text-stone-400 leading-snug">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rapidity of Events */}
            <div>
              <label className="block text-xs font-sans font-medium text-stone-300 mb-2">
                Rapidity of Historical & Political Events
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                {[
                  { id: 'low', label: 'Deliberate Pace', rate: '20% / mo', desc: 'Calm legislative pace.' },
                  { id: 'normal', label: 'Balanced Rhythm', rate: '40% / mo', desc: 'Standard historical flow.' },
                  { id: 'high', label: 'Crisis Tempest', rate: '65% / mo', desc: 'Frequent political shocks.' },
                  { id: 'extreme', label: 'Perpetual Upheaval', rate: '85% / mo', desc: 'Near constant emergencies.' }
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setVolatility(opt.id as any)}
                    className={`cursor-pointer p-3 rounded-xl border text-xs transition-all ${
                      volatility === opt.id
                        ? 'border-amber-500 bg-amber-950/30 text-amber-200 ring-1 ring-amber-500'
                        : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">{opt.label}</div>
                    <div className="text-[10px] font-mono text-amber-400 mb-1">{opt.rate}</div>
                    <div className="text-[10px] text-stone-400">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Politician Identity & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-800">
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-amber-400 mb-2">
                3. Politician Name
              </label>
              <input
                type="text"
                value={politicianName}
                onChange={e => setPoliticianName(e.target.value)}
                placeholder="e.g. Eleanor Vance MP or Sen. Marcus Sterling"
                className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-sans text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-amber-400 mb-2">
                Constituency / District
              </label>
              <input
                type="text"
                value={districtName}
                onChange={e => setDistrictName(e.target.value)}
                placeholder="e.g. Metro-Industrial 4th or Highland Greenshire"
                className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-sans text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* 4. Political Party Banner */}
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-amber-400 mb-2">
              4. Political Party Affiliation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Democratic Alliance', ideology: 'Center-Left Progressive', desc: 'Focus on public investment, clean energy, and healthcare affordability.' },
                { name: 'Conservative Union', ideology: 'Center-Right Free Enterprise', desc: 'Focus on regulatory relief, tax competitiveness, and fiscal balance.' },
                { name: 'Independent Reform Alliance', ideology: 'Trans-Partisan Pragmatists', desc: 'Focus on government efficiency, anti-corruption, and deficit reduction.' }
              ].map(party => (
                <div
                  key={party.name}
                  onClick={() => setPartyName(party.name)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    partyName === party.name
                      ? 'border-amber-500 bg-amber-950/20 text-stone-100 ring-1 ring-amber-500'
                      : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <p className="font-bold text-sm text-stone-200">{party.name}</p>
                  <p className="text-[11px] text-amber-400 font-sans font-medium mb-1">{party.ideology}</p>
                  <p className="text-[11px] text-stone-500 font-sans">{party.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Tandem Play / Shared Central Bank Simulation Link */}
          <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-sans font-bold uppercase text-stone-300">
                  Shared Simulation Link (Tandem Play Readiness)
                </span>
              </div>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/40 text-emerald-300">
                Live Macroeconomic Sync
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans mb-3">
              When linked to a Central Bank session, this political simulator synchronizes real-time interest rates, CPI inflation, 
              and unemployment directly from your central banker's decisions!
            </p>
            <input
              type="text"
              value={linkedCbsSessionId}
              onChange={e => setLinkedCbsSessionId(e.target.value)}
              placeholder="e.g. ses_xxxx (leave blank to run with autonomous macro engine)"
              className="w-full px-4 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono text-stone-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Launch Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-800">
            <p className="text-xs text-stone-500 font-sans">
              Full 50-event causal web • Chief of Staff Statutory Drafting • Floor Whip Operations
            </p>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-sans font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <Award className="w-4 h-4" />
              <span>Inaugurate Political Career</span>
            </button>
          </div>

        </form>
      </main>

    </div>
  );
};
