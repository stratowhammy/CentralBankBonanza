import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, AlertTriangle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface YieldCurveChartProps {
  policyRate: number;
  yield2Y: number;
  yield10Y: number;
}

export const YieldCurveChart: React.FC<YieldCurveChartProps> = ({
  policyRate,
  yield2Y,
  yield10Y
}) => {
  // Synthesize realistic sovereign curve maturities: 3M, 2Y, 5Y, 10Y, 30Y
  const yield3M = Number((policyRate + 0.05).toFixed(2));
  const yield5Y = Number(((yield2Y + yield10Y) / 2 + 0.02).toFixed(2));
  const yield30Y = Number((yield10Y + 0.25).toFixed(2));

  const maturities = ['3M', '2Y', '5Y', '10Y', '30Y'];
  const yields = [yield3M, yield2Y, yield5Y, yield10Y, yield30Y];

  const isInverted = yield2Y > yield10Y;

  const data = {
    labels: maturities,
    datasets: [
      {
        label: 'Sovereign Benchmark Yield (%)',
        data: yields,
        borderColor: isInverted ? 'rgba(244, 63, 94, 1)' : 'rgba(245, 158, 11, 1)',
        backgroundColor: isInverted ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#0f172a',
        pointBorderWidth: 2,
        pointBorderColor: isInverted ? '#f43f5e' : '#f59e0b'
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Yield: ${context.parsed.y.toFixed(2)}%`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)'
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11 }
        }
      },
      y: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)'
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (value: any) => `${value.toFixed(1)}%`
        }
      }
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Sovereign Yield Curve (Term Structure)
          </span>
        </div>

        {isInverted ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>2Y/10Y Inverted ({(yield2Y - yield10Y).toFixed(2)}% spread)</span>
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400 font-mono">
            Normal Upward Slope (+{(yield10Y - yield2Y).toFixed(2)}% spread)
          </span>
        )}
      </div>

      <div className="h-44 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
