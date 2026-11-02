import React from 'react';
import { TurnSnapshot } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EconomicTrendsChartProps {
  history: TurnSnapshot[];
}

export const EconomicTrendsChart: React.FC<EconomicTrendsChartProps> = ({ history }) => {
  if (!history || history.length < 2) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex items-center justify-center text-xs text-slate-500 italic h-56">
        Economic trajectory charts will populate after your second month in office.
      </div>
    );
  }

  const labels = history.map(h => `Y${h.year} M${h.month}`);
  
  const inflationData: number[] = [];
  const rateData: number[] = [];
  const gdpData: number[] = [];
  const unemploymentData: number[] = [];

  for (const h of history) {
    try {
      const snap = JSON.parse(h.economic_snapshot);
      inflationData.push(snap.inflation_cpi);
      rateData.push(snap.interest_rate);
      gdpData.push(snap.gdp_growth);
      unemploymentData.push(snap.unemployment_rate);
    } catch {
      // fallback
    }
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'CPI Inflation (%)',
        data: inflationData,
        borderColor: '#f43f5e',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3
      },
      {
        label: 'Policy Rate (%)',
        data: rateData,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3
      },
      {
        label: 'Real GDP Growth (%)',
        data: gdpData,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 2
      },
      {
        label: 'Unemployment (%)',
        data: unemploymentData,
        borderColor: '#38bdf8',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [2, 2],
        tension: 0.3,
        pointRadius: 2
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          boxWidth: 12,
          font: { family: 'Inter', size: 10 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.25)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.25)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 }, callback: (v: any) => `${v}%` }
      }
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Historical Trajectory (Inflation vs Policy vs Real Economy)
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {history.length} Monthly Snapshots
        </span>
      </div>

      <div className="h-44 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
