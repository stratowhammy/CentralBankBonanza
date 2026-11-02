import React, { useState, useEffect } from 'react';
import { User, PlayMode, Difficulty, SimulationListItem } from '../types';
import { api } from '../api';
import { Play, Check, Trash2, Eye, X, RefreshCw, UserCheck, Users, Sliders } from 'lucide-react';

interface RegularUserDashboardProps {
  user: User | null;
  onStartSimulation: (params: {
    chair_name: string;
    play_mode: PlayMode;
    difficulty: Difficulty;
  }) => Promise<void>;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchToAdmin?: () => void;
}

export const RegularUserDashboard: React.FC<RegularUserDashboardProps> = ({
  user,
  onStartSimulation,
  onOpenAuth,
  onLogout,
  onSwitchToAdmin
}) => {
  // New simulation form state
  const [chairName, setChairName] = useState('Helena Vance');
  const [playMode, setPlayMode] = useState<PlayMode>('first_person');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isStarting, setIsStarting] = useState(false);

  // Previous simulations list state
  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [loadingSimulations, setLoadingSimulations] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SimulationListItem | null>(null);

  // Load previous simulations on mount
  useEffect(() => {
    loadSimulations();
  }, [user]);

  const loadSimulations = async () => {
    try {
      setLoadingSimulations(true);
      const res = await api.getSimulationsList(user?.id);
      setSimulations(res.simulations || []);
    } catch (err) {
      console.error('Failed to load simulations:', err);
    } finally {
      setLoadingSimulations(false);
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      await onStartSimulation({
        chair_name: chairName.trim() || 'Helena Vance',
        play_mode: playMode,
        difficulty
      });
      await loadSimulations();
    } catch (err: any) {
      alert(err.message || 'Failed to start simulation');
    } finally {
      setIsStarting(false);
    }
  };

  const handleRunBatch = async (months: number) => {
    setIsStarting(true);
    try {
      // Create session first
      const startRes = await api.startNewGame({
        user_id: user?.id || 'user_guest_default',
        chair_name: chairName.trim() || 'Helena Vance',
        play_mode: playMode,
        difficulty
      });

      // Simulate the months
      await api.simulateMonths(startRes.session.id, months);
      await loadSimulations();
    } catch (err: any) {
      alert(err.message || 'Simulation batch failed');
    } finally {
      setIsStarting(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('Delete this simulation record?')) return;
    try {
      await api.deleteSimulation(sessionId);
      setSimulations(prev => prev.filter(s => s.id !== sessionId));
      if (selectedResult?.id === sessionId) setSelectedResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete simulation');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'term_completed') {
      return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Reappointed (Term Completed)</span>;
    }
    if (status === 'dismissed') {
      return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">Dismissed</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">In Progress</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white">Central Bank Simulator</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              User Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin View</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-3 text-xs text-slate-300 pl-3 border-l border-slate-800">
                <span>{user.display_name}</span>
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
        
        {/* SECTION 1: Start New Simulation */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-4">New Simulation</h2>

          <form onSubmit={handleStart} className="space-y-6">
            {/* Chair Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Chair Name
              </label>
              <input
                type="text"
                value={chairName}
                onChange={(e) => setChairName(e.target.value)}
                placeholder="Chair Name"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Simulation Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Simulation Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPlayMode('first_person')}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    playMode === 'first_person'
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      First Person Mode
                    </span>
                    {playMode === 'first_person' && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Serve as individual central bank chair; manage policy and job retention.
                  </p>
                </div>

                <div
                  onClick={() => setPlayMode('god_mode')}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    playMode === 'god_mode'
                      ? 'bg-indigo-500/15 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      God Mode
                    </span>
                    {playMode === 'god_mode' && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Oversee multiple chair successions; accumulate institutional credibility.
                  </p>
                </div>
              </div>
            </div>

            {/* Scenario / Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Scenario Setting
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'easy', label: 'Basic', desc: 'Standard economic conditions' },
                  { key: 'normal', label: 'Standard', desc: 'Adds household and social variables' },
                  { key: 'hard', label: 'Political Pressure', desc: 'Adds parliamentary oversight & elections' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDifficulty(opt.key as Difficulty)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      difficulty === opt.key
                        ? 'bg-slate-800 border-amber-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isStarting}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isStarting ? 'Starting...' : 'Start Interactive Simulation'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunBatch(12)}
                disabled={isStarting}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Simulate 1-Year (12 Months)
              </button>

              <button
                type="button"
                onClick={() => handleRunBatch(48)}
                disabled={isStarting}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Simulate Full 4-Year Mandate (48 Months)
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 2: Results of Previous Simulations */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Previous Simulations</h2>
              <p className="text-xs text-slate-400">Records and results of past simulation runs</p>
            </div>
            <button
              onClick={loadSimulations}
              disabled={loadingSimulations}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Refresh results list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSimulations ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingSimulations && simulations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading simulation history...</div>
          ) : simulations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800">
              No previous simulations found. Start your first simulation above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Simulation</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Scenario</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Final Rate</th>
                    <th className="px-4 py-3">Final CPI</th>
                    <th className="px-4 py-3">Approval</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {simulations.map((sim) => (
                    <tr key={sim.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <div>{sim.chair_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{sim.id}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {sim.play_mode === 'first_person' ? 'First Person' : 'God Mode'}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {sim.difficulty}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {sim.total_months_elapsed} mos (Yr {sim.current_year}, M{sim.current_month})
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(sim.status)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-amber-300">
                        {sim.results.interest_rate.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {sim.results.inflation_cpi.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {sim.results.parliamentary_approval.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedResult(sim)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                        >
                          View Results
                        </button>
                        <button
                          onClick={() => handleDelete(sim.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Result Details Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">Simulation Results</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedResult.id}</p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Chair Name</span>
                  <span className="font-semibold text-white text-sm">{selectedResult.chair_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Simulation Type</span>
                  <span className="font-semibold text-white text-sm capitalize">
                    {selectedResult.play_mode === 'first_person' ? 'First Person' : 'God Mode'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Scenario</span>
                  <span className="font-semibold text-white text-sm capitalize">{selectedResult.difficulty}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Duration</span>
                  <span className="font-semibold text-white text-sm font-mono">
                    {selectedResult.total_months_elapsed} Months ({Math.floor(selectedResult.total_months_elapsed / 12)} Yrs, {selectedResult.total_months_elapsed % 12} Mos)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Final Status & Verdict</span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>{getStatusBadge(selectedResult.status)}</div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Reappointments: {selectedResult.results.reappointment_count}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Final Rate</span>
                  <span className="text-base font-bold font-mono text-amber-300">
                    {selectedResult.results.interest_rate.toFixed(2)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Final CPI</span>
                  <span className="text-base font-bold font-mono text-slate-100">
                    {selectedResult.results.inflation_cpi.toFixed(2)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Approval</span>
                  <span className="text-base font-bold font-mono text-slate-100">
                    {selectedResult.results.parliamentary_approval.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-slate-400 text-[10px] uppercase block mb-1">Last Action / Note</span>
                <span>{selectedResult.results.last_action_details}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
