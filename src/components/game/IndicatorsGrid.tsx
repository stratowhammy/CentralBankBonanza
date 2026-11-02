import React from 'react';
import { GameSession } from '../../types';
import { 
  Percent, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Home, 
  Building2, 
  ShieldCheck, 
  BarChart3,
  Layers,
  AlertOctagon,
  Flame
} from 'lucide-react';

interface IndicatorsGridProps {
  session: GameSession;
  onOpenDotPlot?: () => void;
  onOpenBalanceSheet?: () => void;
  onOpenMpcVote?: () => void;
}

export const IndicatorsGrid: React.FC<IndicatorsGridProps> = ({ 
  session,
  onOpenDotPlot,
  onOpenBalanceSheet,
  onOpenMpcVote
}) => {
  const s = session.economic_state;
  const isNormalOrHard = session.difficulty === 'normal' || session.difficulty === 'hard';
  const isHard = session.difficulty === 'hard';
  const yieldInversion = s.bond_yield_2y > s.bond_yield_10y;
  const inflationGap = s.inflation_cpi - 2.0;

  return (
    <div className="space-y-4">
      
      {/* Credibility Warning / Taper Tantrum Alert if triggered */}
      {s.credibility_warning && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950/80 border border-rose-500/60 rounded-xl p-3.5 flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                  Market Credibility Alert
                </span>
                <span className="font-bold text-xs text-rose-100">
                  {s.credibility_warning}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Financial markets punished forward guidance volte-face: 2Y yields surged +28 bps, equities fell 120 pts, and market trust dropped.
              </p>
            </div>
          </div>
          <div className="text-right pl-4">
            <span className="text-xs font-mono font-bold text-rose-300">
              Credibility: {s.market_credibility?.toFixed(1) || '60.0'}%
            </span>
          </div>
        </div>
      )}

      {/* Active Events Banner if any shock is live */}
      {s.active_events && s.active_events.length > 0 && (
        <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-950 border border-purple-500/40 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping"></span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Macroeconomic Shock: {s.active_events[0].category}
                </span>
                <span className="font-bold text-xs text-slate-100">
                  {s.active_events[0].name}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {s.active_events[0].summary}
              </p>
            </div>
          </div>
          <div className="text-right pl-4">
            <span className="text-[11px] font-mono text-purple-300">
              {s.active_events[0].duration_remaining} mos remaining
            </span>
          </div>
        </div>
      )}

      {/* Primary Monetary & Macro Core Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Policy Rate */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Policy Rate</span>
            <Percent className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-data text-2xl font-bold text-amber-300">
            {s.interest_rate.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Taylor Rule:</span>
            <span className="font-mono text-slate-300 font-bold">{session.taylor_rule.toFixed(2)}%</span>
          </div>
        </div>

        {/* CPI Inflation with Decoupled Flexible vs Sticky Breakdown */}
        <div className={`bg-slate-900/90 border rounded-xl p-3.5 shadow-md flex flex-col justify-between ${
          s.inflation_cpi > 4.0 ? 'border-rose-500/40' : (s.inflation_cpi < 1.0 ? 'border-blue-500/40' : 'border-slate-800')
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Headline CPI</span>
            {inflationGap > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className={`font-data text-2xl font-bold ${
            s.inflation_cpi > 4.0 ? 'text-rose-400' : (Math.abs(inflationGap) <= 0.5 ? 'text-emerald-400' : 'text-amber-300')
          }`}>
            {s.inflation_cpi.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span>Target 2.0%:</span>
              <span className={`font-mono font-medium ${inflationGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {inflationGap > 0 ? `+${inflationGap.toFixed(1)}%` : `${inflationGap.toFixed(1)}%`}
              </span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono flex justify-between">
              <span>Flex: {s.flexible_cpi?.toFixed(1) || s.inflation_cpi.toFixed(1)}%</span>
              <span>Sticky: {s.sticky_cpi?.toFixed(1) || s.core_inflation.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Real GDP Growth */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Real GDP</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`font-data text-2xl font-bold ${s.gdp_growth < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
            {s.gdp_growth > 0 ? `+${s.gdp_growth.toFixed(2)}%` : `${s.gdp_growth.toFixed(2)}%`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Potential: 2.1%</span>
            <span className="font-mono text-slate-300">Annualized</span>
          </div>
        </div>

        {/* Unemployment */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Unemployment</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className={`font-data text-2xl font-bold ${s.unemployment_rate > 5.5 ? 'text-rose-400' : 'text-slate-100'}`}>
            {s.unemployment_rate.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>NAIRU: 4.2%</span>
            <span className="font-mono text-slate-300">Labor Force</span>
          </div>
        </div>

        {/* Doll Street Stock Index */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Doll Street Idx</span>
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-data text-2xl font-bold text-slate-100">
            {s.stock_market_index.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Prime Loan:</span>
            <span className="font-mono text-amber-300 font-bold">{s.bank_lending_rate.toFixed(2)}%</span>
          </div>
        </div>

        {/* 10Y Yield & Inversion Warning */}
        <div className={`bg-slate-900/90 border rounded-xl p-3.5 shadow-md flex flex-col justify-between ${
          yieldInversion ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">10Y Treasury</span>
            {yieldInversion && (
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Inverted
              </span>
            )}
          </div>
          <div className="font-data text-2xl font-bold text-slate-100">
            {s.bond_yield_10y.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>2Y Yield: {s.bond_yield_2y.toFixed(2)}%</span>
            <span className={`font-mono font-bold ${yieldInversion ? 'text-rose-400' : 'text-slate-300'}`}>
              {(s.bond_yield_10y - s.bond_yield_2y).toFixed(2)}%
            </span>
          </div>
        </div>

      </div>

      {/* Institutional Tools & Operations Ribbon (Pillars B, C, E) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
        {/* Balance Sheet / QT */}
        <div 
          onClick={onOpenBalanceSheet}
          className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Central Bank Portfolio</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              ${(s.balance_sheet_size ?? 7.20).toFixed(2)}T
            </span>
            <span className="text-[10px] text-slate-500 block">
              {(s.qt_monthly_pace ?? -25) < 0 ? `QT: -$${Math.abs(s.qt_monthly_pace ?? 25)}B/mo` : 'QE Portfolio'}
            </span>
          </div>
          <span className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded">
            Manage ⚙
          </span>
        </div>

        {/* MPC Committee Status */}
        <div 
          onClick={onOpenMpcVote}
          className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">MPC Board Vote</span>
            <span className="font-mono text-indigo-300 font-bold text-sm">
              {s.last_mpc_vote ? s.last_mpc_vote.tally_label : '9-0 Consensus'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {s.last_mpc_vote ? `${s.last_mpc_vote.dissents} Dissents` : 'Next Vote: Month 3'}
            </span>
          </div>
          <span className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded">
            Record ⚖
          </span>
        </div>

        {/* Market Credibility */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Market Credibility</span>
            <span className={`font-mono font-bold text-sm ${(s.market_credibility ?? 75) < 50 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {(s.market_credibility ?? 75).toFixed(1)} / 100
            </span>
            <span className="text-[10px] text-slate-500 block">
              {s.credibility_warning ? 'Tantrum Penalty' : 'Guidance Respected'}
            </span>
          </div>
          <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            ◈
          </span>
        </div>

        {/* Dot-Plot Projections */}
        <div 
          onClick={onOpenDotPlot}
          className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">FOMC Dot-Plot</span>
            <span className="font-mono text-purple-300 font-bold text-sm">
              Median 1Y: {session.dot_plot?.median_projections.year_1 ?? 4.25}%
            </span>
            <span className="text-[10px] text-slate-500 block">
              Neutral r*: {session.dot_plot?.median_projections.long_run ?? 3.50}%
            </span>
          </div>
          <span className="text-xs text-purple-400 hover:text-white bg-purple-950/60 border border-purple-500/30 px-2 py-1 rounded">
            View Dots ☵
          </span>
        </div>
      </div>

      {/* Secondary Indicators: Social (Normal+) & Political (Hard+) & Mode Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Card 1: Social & Household Health (Normal+) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Social & Household Health</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {isNormalOrHard ? 'Gotham Telemetry' : 'Locked in Easy'}
            </span>
          </div>

          {isNormalOrHard ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Real Wage Growth</span>
                <span className={`font-data font-bold text-sm ${s.real_wage_growth < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {s.real_wage_growth > 0 ? `+${s.real_wage_growth.toFixed(1)}%` : `${s.real_wage_growth.toFixed(1)}%`}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Housing Cost Index</span>
                <span className="font-data font-bold text-sm text-slate-200">
                  {s.housing_cost_index.toFixed(1)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Consumer Sentiment</span>
                <span className="font-data font-bold text-sm text-amber-300">
                  {s.consumer_confidence.toFixed(1)} / 100
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Strike & Discontent</span>
                <span className={`font-data font-bold text-sm ${s.poverty_discontent > 60 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {s.poverty_discontent.toFixed(1)} / 100
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              Enable Normal or Hard mode to unlock household living standards, housing pressures, and labor union telemetry.
            </div>
          )}
        </div>

        {/* Card 2: Parliamentary Politics & Fiscal Balance (Hard+) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Parliament & Fiscal Arena</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {isHard ? 'Cashington Telemetry' : 'Locked in Normal'}
            </span>
          </div>

          {isHard ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Parliament Approval</span>
                <span className={`font-data font-bold text-sm ${s.parliamentary_approval < 40 ? 'text-rose-400' : 'text-purple-300'}`}>
                  {s.parliamentary_approval.toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Fiscal Deficit</span>
                <span className="font-data font-bold text-sm text-rose-400">
                  {s.fiscal_deficit.toFixed(2)}% of GDP
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Debt-to-GDP</span>
                <span className="font-data font-bold text-sm text-slate-200">
                  {s.debt_to_gdp.toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[11px] block">Next Election</span>
                <span className="font-data font-bold text-sm text-amber-300">
                  {s.months_to_election} months
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              Enable Hard mode to experience parliamentary grilling, fiscal debt constraints, and election pressure.
            </div>
          )}
        </div>

        {/* Card 3: Mode-Specific Career / Trust Status & Term Milestone */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {session.play_mode === 'first_person' ? 'Chair Survival & 4-Yr Term' : 'Institutional Trust & Inertia'}
              </span>
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              {session.play_mode === 'first_person' ? 'First Person' : 'God Mode'}
            </span>
          </div>

          {session.play_mode === 'first_person' ? (
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Survival Meter:</span>
                  <span className={`font-mono font-bold ${s.job_security < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {s.job_security.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      s.job_security < 30 
                        ? 'bg-rose-500' 
                        : (s.job_security < 60 ? 'bg-amber-500' : 'bg-emerald-500')
                    }`}
                    style={{ width: `${s.job_security}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span>4-Year Mandate:</span>
                <span className="font-bold font-mono text-indigo-300">
                  Month {(s.term_months_completed ?? session.total_months_elapsed) % 48} / 48
                  {(s.reappointment_count ?? 0) > 0 && ` (${s.reappointment_count} Reappointed)`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span>Parliamentary Warnings:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded ${s.warning_count >= 2 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-300'}`}>
                  {s.warning_count} / 3
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Chair Trust Level:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {session.chair_state.active_chair.starting_trust.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${session.chair_state.active_chair.starting_trust}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span>Public Reaction Multiplier:</span>
                <span className="font-bold font-mono text-indigo-300">
                  {(1.0 - 0.50 * (session.chair_state.active_chair.starting_trust / 100)).toFixed(2)}x
                  <span className="text-[10px] text-slate-500 ml-1 font-normal">(Muted)</span>
                </span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
