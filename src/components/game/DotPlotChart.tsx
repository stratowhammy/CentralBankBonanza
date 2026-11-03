import React from 'react';
import { DotPlotData } from '../../types';

interface DotPlotChartProps {
  dotPlotData?: DotPlotData;
  isOpen: boolean;
  onClose: () => void;
}

export const DotPlotChart: React.FC<DotPlotChartProps> = ({ dotPlotData, isOpen, onClose }) => {
  if (!isOpen || !dotPlotData) return null;

  const horizons = [
    { key: 'year_1', label: 'End of Year 1', median: dotPlotData.median_projections.year_1 },
    { key: 'year_2', label: 'End of Year 2', median: dotPlotData.median_projections.year_2 },
    { key: 'long_run', label: 'Longer Run (Neutral r*)', median: dotPlotData.median_projections.long_run }
  ];

  // Min and max for Y-axis scale (0% to 8%)
  const minRate = 1.0;
  const maxRate = 7.0;
  const range = maxRate - minRate;

  const getYPercent = (rate: number) => {
    const clamped = Math.max(minRate, Math.min(maxRate, rate));
    // 100% at bottom, 0% at top
    return 100 - ((clamped - minRate) / range) * 100;
  };

  const getRoleColor = (role: string) => {
    if (role === 'Hawk') return 'bg-rose-500 ring-rose-300';
    if (role === 'Dove') return 'bg-emerald-500 ring-emerald-300';
    if (role === 'Chair') return 'bg-indigo-600 ring-indigo-300 ring-2';
    return 'bg-amber-500 ring-amber-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/75 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t md:border border-slate-700 rounded-t-[7vw] md:rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] md:max-h-[90vh]">
        {/* Android Drag Handle (Mobile Only) */}
        <div className="md:hidden w-[11vw] h-[0.55vh] min-h-[4px] rounded-full bg-slate-600/50 mx-auto my-[1.2vh] flex-shrink-0" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xl font-mono">
              ☵
            </span>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Monetary Policy Committee Dot-Plot
              </h2>
              <p className="text-xs text-slate-400">
                Individual target interest rate projections across 9 Committee members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 text-sm rounded-lg hover:bg-slate-800"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Current Policy Rate</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{dotPlotData.current_rate.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Year 1 Median Dot</div>
              <div className="text-2xl font-bold font-mono text-indigo-400">{dotPlotData.median_projections.year_1.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Year 2 Median Dot</div>
              <div className="text-2xl font-bold font-mono text-purple-400">{dotPlotData.median_projections.year_2.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Neutral Terminal (r*)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{dotPlotData.median_projections.long_run.toFixed(2)}%</div>
            </div>
          </div>

          {/* Interactive Dot-Plot Canvas */}
          <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800">
            <div className="relative h-80 flex">
              {/* Y-Axis Labels */}
              <div className="w-16 flex flex-col justify-between text-right pr-3 text-xs font-mono text-slate-500 select-none">
                <div>7.00%</div>
                <div>6.00%</div>
                <div>5.00%</div>
                <div>4.00%</div>
                <div>3.00%</div>
                <div>2.00%</div>
                <div>1.00%</div>
              </div>

              {/* Grid Lines */}
              <div className="flex-1 relative border-l border-b border-slate-800">
                {[0, 16.66, 33.33, 50, 66.66, 83.33, 100].map((pct, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-slate-800/60"
                    style={{ top: `${pct}%` }}
                  />
                ))}

                {/* Columns for the 3 horizons */}
                <div className="absolute inset-0 grid grid-cols-3 divide-x divide-slate-800/40">
                  {horizons.map((h) => {
                    const medianY = getYPercent(h.median);
                    return (
                      <div key={h.key} className="relative flex justify-center items-center h-full">
                        {/* Median horizontal bar */}
                        <div
                          className="absolute w-28 h-1 bg-amber-400/80 rounded z-10 shadow-sm shadow-amber-400/50 flex items-center justify-center"
                          style={{ top: `${medianY}%` }}
                        >
                          <span className="absolute -top-5 text-[10px] font-mono bg-amber-950 text-amber-300 px-1 rounded border border-amber-500/40">
                            Median {h.median.toFixed(2)}%
                          </span>
                        </div>

                        {/* Member Dots */}
                        <div className="relative w-full h-full flex justify-center items-center">
                          {dotPlotData.dots.map((dot, idx) => {
                            const val = parseFloat((dot as any)[h.key]);
                            const topPct = getYPercent(val);
                            // Slight jitter horizontally so dots don't completely overlap
                            const jitterX = ((idx % 3) - 1) * 14;

                            return (
                              <div
                                key={dot.member_id}
                                className={`absolute w-3.5 h-3.5 rounded-full ring-2 shadow-md cursor-pointer transition-transform hover:scale-150 z-20 ${getRoleColor(
                                  dot.role
                                )}`}
                                style={{
                                  top: `${topPct}%`,
                                  transform: `translate(${jitterX}px, -50%)`
                                }}
                                title={`${dot.name} (${dot.role}): ${val.toFixed(2)}%`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="ml-16 grid grid-cols-3 pt-3 text-center">
              {horizons.map(h => (
                <div key={h.key} className="text-xs font-semibold text-slate-300">
                  {h.label}
                </div>
              ))}
            </div>
          </div>

          {/* Legend and Member Breakdown */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-300">Committee Member Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-1 ring-indigo-300" /> Helena Vance (Chair)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Hawks (Tightening Bias)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Centrists (Balanced)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Doves (Accommodation Bias)
                </span>
              </div>
            </div>

            {/* Member Dot Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {dotPlotData.dots.map(d => (
                <div key={d.member_id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-200">{d.name}</div>
                    <div className="text-[10px] text-slate-400">{d.role}</div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-300 space-x-2">
                    <span>1Y: <strong className="text-indigo-400">{d.year_1}%</strong></span>
                    <span>2Y: <strong className="text-purple-400">{d.year_2}%</strong></span>
                    <span>LR: <strong className="text-emerald-400">{d.long_run}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close Dot-Plot
          </button>
        </div>
      </div>
    </div>
  );
};
