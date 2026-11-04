import React, { useState, useEffect } from 'react';
import { PoliticalSystemType } from '../../types';
import { Landmark, Scale, Users, Shield, Award, Sparkles, Building2, Vote, ArrowRight } from 'lucide-react';

interface Props {
  onStartCareer: (params: {
    politician_name: string;
    system_type: PoliticalSystemType;
    selected_track?: string;
    party_name: string;
    district_name: string;
    linked_cbs_session_id?: string;
  }) => void;
  onSwitchToCbs: () => void;
}

export const PoliticalLanding: React.FC<Props> = ({ onStartCareer, onSwitchToCbs }) => {
  const [systemType, setSystemType] = useState<PoliticalSystemType>('parliamentary');
  const [politicianName, setPoliticianName] = useState('Eleanor Vance');
  const [selectedTrack, setSelectedTrack] = useState('backbencher');
  const [partyName, setPartyName] = useState('Democratic Alliance');
  const [districtName, setDistrictName] = useState('Highland Greenshire');
  const [linkedCbsSessionId, setLinkedCbsSessionId] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      linked_cbs_session_id: linkedCbsSessionId.trim() || undefined
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-serif selection:bg-amber-900 selection:text-amber-100">
      
      {/* Top Banner / Chamber Crest */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-red-950 border border-amber-600/40 flex items-center justify-center text-amber-400 shadow-md">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-amber-200 uppercase font-sans">Statecraft: The Political Simulator</h1>
            <p className="text-xs text-stone-400 font-sans">Executive & Legislative Strategy Engine • Port: ~/ps</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onSwitchToCbs}
            className="px-4 py-2 text-xs font-sans font-bold uppercase rounded-lg border border-amber-500/40 bg-stone-800 hover:bg-stone-700 text-amber-300 transition-colors flex items-center space-x-2"
          >
            <span>Switch to Central Bank Sim (~/cbs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero & Career Form */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
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

        {/* Configuration Card */}
        <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
          
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
                  Progress from Backbench MP to Committee Chair, Cabinet Minister, and ultimately Prime Minister. 
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
                  Progress from US House Representative to Committee Chair / Whip, US Senator, and President of the United States. 
                  High-stakes 2-year district cycles, Senate filibusters, and high-dollar PAC fundraising.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Politician Identity & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-amber-400 mb-2">
                2. Politician Name
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
                Constituency / Congressional District
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

          {/* 3. Political Party Banner */}
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-amber-400 mb-2">
              3. Political Party Affiliation
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

          {/* 4. Tandem Play / Shared Central Bank Simulation Link */}
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
