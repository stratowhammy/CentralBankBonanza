import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameSession, TurnSnapshot, EconomicState } from '../../types';
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
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  GripHorizontal, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  BarChart2, 
  Sliders, 
  Layers,
  RotateCcw
} from 'lucide-react';

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

export interface VariableDef {
  id: string;
  label: string;
  shortLabel: string;
  category: 'Monetary' | 'Financial' | 'Social' | 'Political' | 'Balance Sheet';
  unit: string;
  color: string;
  yAxis: 'percentage' | 'index' | 'amount';
  formatter: (val: number) => string;
  getter: (snap: EconomicState) => number;
}

export const VARIABLE_CATALOG: VariableDef[] = [
  // Monetary & Core Macro
  {
    id: 'interest_rate',
    label: 'Central Bank Policy Rate',
    shortLabel: 'Policy Rate',
    category: 'Monetary',
    unit: '%',
    color: '#f59e0b', // amber
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.interest_rate
  },
  {
    id: 'inflation_cpi',
    label: 'Headline CPI Inflation',
    shortLabel: 'CPI Inflation',
    category: 'Monetary',
    unit: '%',
    color: '#f43f5e', // rose
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.inflation_cpi
  },
  {
    id: 'core_inflation',
    label: 'Core Inflation (ex-food/energy)',
    shortLabel: 'Core CPI',
    category: 'Monetary',
    unit: '%',
    color: '#fb7185', // pink
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.core_inflation ?? s.inflation_cpi
  },
  {
    id: 'flexible_cpi',
    label: 'Flexible Price CPI',
    shortLabel: 'Flex CPI',
    category: 'Monetary',
    unit: '%',
    color: '#fb923c', // orange
    yAxis: 'percentage',
    formatter: v => `${(v ?? 0).toFixed(2)}%`,
    getter: s => s.flexible_cpi ?? s.inflation_cpi
  },
  {
    id: 'sticky_cpi',
    label: 'Sticky Price CPI',
    shortLabel: 'Sticky CPI',
    category: 'Monetary',
    unit: '%',
    color: '#e11d48', // crimson
    yAxis: 'percentage',
    formatter: v => `${(v ?? 0).toFixed(2)}%`,
    getter: s => s.sticky_cpi ?? (s.core_inflation ?? s.inflation_cpi)
  },
  {
    id: 'gdp_growth',
    label: 'Real GDP Growth (Annualized)',
    shortLabel: 'GDP Growth',
    category: 'Monetary',
    unit: '%',
    color: '#10b981', // emerald
    yAxis: 'percentage',
    formatter: v => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`,
    getter: s => s.gdp_growth
  },
  {
    id: 'unemployment_rate',
    label: 'Unemployment Rate (Labor Force)',
    shortLabel: 'Unemployment',
    category: 'Monetary',
    unit: '%',
    color: '#38bdf8', // sky
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.unemployment_rate
  },

  // Financial Markets & Yield Curve
  {
    id: 'bond_yield_10y',
    label: '10-Year Sovereign Benchmark Yield',
    shortLabel: '10Y Yield',
    category: 'Financial',
    unit: '%',
    color: '#818cf8', // indigo
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.bond_yield_10y
  },
  {
    id: 'bond_yield_2y',
    label: '2-Year Sovereign Policy-Sensitive Yield',
    shortLabel: '2Y Yield',
    category: 'Financial',
    unit: '%',
    color: '#a78bfa', // purple
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.bond_yield_2y
  },
  {
    id: 'yield_spread_2s10s',
    label: '2s10s Yield Curve Inversion Spread',
    shortLabel: '2s10s Spread',
    category: 'Financial',
    unit: '%',
    color: '#c084fc', // purple light
    yAxis: 'percentage',
    formatter: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
    getter: s => (s.bond_yield_10y - s.bond_yield_2y)
  },
  {
    id: 'stock_market_index',
    label: 'Doll Street Equity Market Index',
    shortLabel: 'Doll Street Idx',
    category: 'Financial',
    unit: 'pts',
    color: '#34d399', // mint
    yAxis: 'index',
    formatter: v => v.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    getter: s => s.stock_market_index
  },
  {
    id: 'bank_lending_rate',
    label: 'Commercial Bank Prime Lending Rate',
    shortLabel: 'Prime Loan Rate',
    category: 'Financial',
    unit: '%',
    color: '#eab308', // yellow
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.bank_lending_rate
  },
  {
    id: 'currency_index',
    label: 'Trade-Weighted Currency Index',
    shortLabel: 'FX Currency Idx',
    category: 'Financial',
    unit: 'pts',
    color: '#06b6d4', // cyan
    yAxis: 'index',
    formatter: v => v.toFixed(1),
    getter: s => s.currency_index
  },

  // Social & Living Standards
  {
    id: 'real_wage_growth',
    label: 'Real Wage Growth (Purchasing Power)',
    shortLabel: 'Real Wages',
    category: 'Social',
    unit: '%',
    color: '#2dd4bf', // teal
    yAxis: 'percentage',
    formatter: v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
    getter: s => s.real_wage_growth
  },
  {
    id: 'housing_cost_index',
    label: 'Housing Cost & Rent Index',
    shortLabel: 'Housing Cost Idx',
    category: 'Social',
    unit: 'pts',
    color: '#f97316', // orange
    yAxis: 'index',
    formatter: v => v.toFixed(1),
    getter: s => s.housing_cost_index
  },
  {
    id: 'consumer_confidence',
    label: 'Household Consumer Sentiment Index',
    shortLabel: 'Consumer Sentiment',
    category: 'Social',
    unit: 'pts',
    color: '#ec4899', // pink-rose
    yAxis: 'index',
    formatter: v => `${v.toFixed(1)} / 100`,
    getter: s => s.consumer_confidence
  },
  {
    id: 'poverty_discontent',
    label: 'Public Discontent & Cost-of-Living Stress',
    shortLabel: 'Discontent Index',
    category: 'Social',
    unit: 'pts',
    color: '#dc2626', // red
    yAxis: 'index',
    formatter: v => `${v.toFixed(1)} / 100`,
    getter: s => s.poverty_discontent
  },

  // Governance & Institutional
  {
    id: 'parliamentary_approval',
    label: 'Parliamentary Committee Approval',
    shortLabel: 'Parliament Approval',
    category: 'Political',
    unit: '%',
    color: '#8b5cf6', // violet
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(1)}%`,
    getter: s => s.parliamentary_approval
  },
  {
    id: 'public_approval',
    label: 'Public Approval Rating',
    shortLabel: 'Public Approval',
    category: 'Political',
    unit: '%',
    color: '#6366f1', // indigo
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(1)}%`,
    getter: s => s.public_approval
  },
  {
    id: 'market_credibility',
    label: 'Central Bank Market Credibility',
    shortLabel: 'Credibility',
    category: 'Political',
    unit: 'pts',
    color: '#0ea5e9', // ocean
    yAxis: 'index',
    formatter: v => `${(v ?? 75).toFixed(1)} / 100`,
    getter: s => s.market_credibility ?? 75
  },
  {
    id: 'job_security',
    label: 'Central Bank Chair Job Security',
    shortLabel: 'Job Security',
    category: 'Political',
    unit: '%',
    color: '#22c55e', // green
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(1)}%`,
    getter: s => s.job_security
  },
  {
    id: 'fiscal_deficit',
    label: 'Government Fiscal Deficit (% of GDP)',
    shortLabel: 'Fiscal Deficit',
    category: 'Political',
    unit: '%',
    color: '#f43f5e', // rose
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(2)}%`,
    getter: s => s.fiscal_deficit
  },
  {
    id: 'debt_to_gdp',
    label: 'National Debt-to-GDP Ratio',
    shortLabel: 'Debt-to-GDP',
    category: 'Political',
    unit: '%',
    color: '#94a3b8', // slate
    yAxis: 'percentage',
    formatter: v => `${v.toFixed(1)}%`,
    getter: s => s.debt_to_gdp
  },
  {
    id: 'balance_sheet_size',
    label: 'Central Bank Balance Sheet Assets',
    shortLabel: 'Balance Sheet',
    category: 'Balance Sheet',
    unit: '$T',
    color: '#14b8a6', // teal
    yAxis: 'amount',
    formatter: v => `$${(v ?? 7.2).toFixed(2)}T`,
    getter: s => s.balance_sheet_size ?? 7.2
  }
];

export interface PresetTheme {
  id: string;
  name: string;
  icon: string;
  variableIds: string[];
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'dual_mandate',
    name: 'Dual Mandate',
    icon: '🎯',
    variableIds: ['inflation_cpi', 'unemployment_rate', 'interest_rate']
  },
  {
    id: 'monetary_stance',
    name: 'Monetary Policy',
    icon: '🏛',
    variableIds: ['interest_rate', 'bond_yield_10y', 'bank_lending_rate']
  },
  {
    id: 'yield_curve',
    name: 'Yield Inversion',
    icon: '📉',
    variableIds: ['bond_yield_10y', 'bond_yield_2y', 'yield_spread_2s10s']
  },
  {
    id: 'living_standards',
    name: 'Living Standards',
    icon: '🛒',
    variableIds: ['real_wage_growth', 'inflation_cpi', 'housing_cost_index']
  },
  {
    id: 'political_governance',
    name: 'Politics & Mandate',
    icon: '⚖',
    variableIds: ['parliamentary_approval', 'job_security', 'market_credibility']
  },
  {
    id: 'wall_vs_main',
    name: 'Markets & Growth',
    icon: '💼',
    variableIds: ['stock_market_index', 'gdp_growth', 'consumer_confidence']
  }
];

interface VariableGraphOverlayProps {
  session: GameSession;
  isOpen: boolean;
  onClose: () => void;
  initialVariableId?: string;
}

export const VariableGraphOverlay: React.FC<VariableGraphOverlayProps> = ({
  session,
  isOpen,
  onClose,
  initialVariableId
}) => {
  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      const initialX = Math.max(20, Math.min(w - 680, w * 0.45));
      const initialY = 80;
      return { x: initialX, y: initialY };
    }
    return { x: 100, y: 80 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);

  // Window state: 'normal' | 'expanded' | 'minimized'
  const [windowState, setWindowState] = useState<'normal' | 'expanded' | 'minimized'>('normal');

  // Selected variables to plot
  const [selectedIds, setSelectedIds] = useState<string[]>(['inflation_cpi', 'interest_rate', 'gdp_growth']);

  // Time horizon: 'all' | '12' | '24'
  const [timeHorizon, setTimeHorizon] = useState<'all' | '12' | '24'>('all');

  // Add variable dropdown open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Synchronize initialVariableId if provided
  useEffect(() => {
    if (initialVariableId) {
      setSelectedIds(prev => {
        if (prev.includes(initialVariableId)) return prev;
        return [...prev, initialVariableId];
      });
      if (windowState === 'minimized') {
        setWindowState('normal');
      }
    }
  }, [initialVariableId]);

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) {
      return;
    }
    setIsDragging(true);
    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: position.x,
      startY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startMouseX;
      const dy = e.clientY - dragRef.current.startMouseY;
      const overlayWidth = windowState === 'expanded' ? 880 : (windowState === 'minimized' ? 320 : 640);
      const newX = Math.max(10, Math.min(window.innerWidth - overlayWidth - 10, dragRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, windowState]);

  // Touch drag listeners for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startMouseX: touch.clientX,
      startMouseY: touch.clientY,
      startX: position.x,
      startY: position.y
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startMouseX;
    const dy = touch.clientY - dragRef.current.startMouseY;
    const overlayWidth = windowState === 'expanded' ? 880 : (windowState === 'minimized' ? 320 : 640);
    const newX = Math.max(10, Math.min(window.innerWidth - overlayWidth - 10, dragRef.current.startX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.startY + dy));
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  // Compile timeline from history + live session state
  const timelinePoints = useMemo(() => {
    const points: {
      label: string;
      year: number;
      month: number;
      actionText: string;
      state: EconomicState;
    }[] = [];

    const history = session.history || [];
    for (const h of history) {
      try {
        const snap: EconomicState = JSON.parse(h.economic_snapshot);
        points.push({
          label: `Y${h.year} M${h.month}`,
          year: h.year,
          month: h.month,
          actionText: h.action_type === 'inaugural' ? 'Sworn In' : `${h.action_type} ${h.action_value || ''}`.trim(),
          state: snap
        });
      } catch (e) {
        // skip unparseable
      }
    }

    // If history is empty, use current live session state
    if (points.length === 0 && session.economic_state) {
      points.push({
        label: `Y${session.current_year} M${session.current_month}`,
        year: session.current_year,
        month: session.current_month,
        actionText: 'Current Month',
        state: session.economic_state
      });
    }

    // Filter by time horizon
    if (timeHorizon === '12') {
      return points.slice(-12);
    }
    if (timeHorizon === '24') {
      return points.slice(-24);
    }
    return points;
  }, [session.history, session.economic_state, session.current_year, session.current_month, timeHorizon]);

  // Active variable definitions
  const activeVars = useMemo(() => {
    return selectedIds
      .map(id => VARIABLE_CATALOG.find(v => v.id === id))
      .filter((v): v is VariableDef => v !== undefined);
  }, [selectedIds]);

  // Determine if we need dual Y-axes (percentage vs index/amount)
  const hasPercentageAxis = useMemo(() => activeVars.some(v => v.yAxis === 'percentage'), [activeVars]);
  const hasIndexAxis = useMemo(() => activeVars.some(v => v.yAxis === 'index' || v.yAxis === 'amount'), [activeVars]);

  // Chart data
  const chartData = useMemo(() => {
    const labels = timelinePoints.map(p => p.label);
    const datasets = activeVars.map((vDef, idx) => {
      const data = timelinePoints.map(p => vDef.getter(p.state));
      return {
        label: vDef.shortLabel,
        data,
        borderColor: vDef.color,
        backgroundColor: `${vDef.color}15`,
        yAxisID: vDef.yAxis === 'percentage' ? 'y' : 'y1',
        borderWidth: 2.2,
        tension: 0.28,
        pointRadius: timelinePoints.length > 24 ? 2 : 3.5,
        pointHoverRadius: 6,
        fill: idx === 0 && activeVars.length === 1 // fill under line if only 1 variable
      };
    });

    return { labels, datasets };
  }, [timelinePoints, activeVars]);

  // Chart options
  const chartOptions: any = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: '#cbd5e1',
            font: { size: 11, family: 'system-ui, sans-serif' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(51, 65, 85, 0.8)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: (items: any[]) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              const point = timelinePoints[idx];
              return `${point.label} • ${point.actionText}`;
            },
            label: (item: any) => {
              const vDef = activeVars[item.datasetIndex];
              const val = item.parsed.y;
              return ` ${vDef.shortLabel}: ${vDef.formatter(val)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: windowState === 'expanded' ? 16 : 8
          }
        },
        y: {
          type: 'linear',
          display: hasPercentageAxis,
          position: 'left',
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            callback: (v: number) => `${v}%`
          }
        },
        y1: {
          type: 'linear',
          display: hasIndexAxis,
          position: 'right',
          grid: { drawOnChartArea: !hasPercentageAxis, color: 'rgba(51, 65, 85, 0.2)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            callback: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
          }
        }
      }
    };
  }, [timelinePoints, activeVars, hasPercentageAxis, hasIndexAxis, windowState]);

  // Statistics calculation for active variables
  const stats = useMemo(() => {
    return activeVars.map(vDef => {
      const values = timelinePoints.map(p => vDef.getter(p.state));
      if (values.length === 0) {
        return {
          def: vDef,
          current: 0,
          start: 0,
          delta: 0,
          min: 0,
          max: 0
        };
      }
      const start = values[0];
      const current = values[values.length - 1];
      const delta = current - start;
      const min = Math.min(...values);
      const max = Math.max(...values);
      return {
        def: vDef,
        current,
        start,
        delta,
        min,
        max
      };
    });
  }, [timelinePoints, activeVars]);

  // Toggle variable
  const handleToggleVariable = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 6) {
          alert('Maximum 6 variables can be graphed simultaneously.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Select preset theme
  const handleSelectPreset = (preset: PresetTheme) => {
    setSelectedIds(preset.variableIds);
  };

  if (!isOpen) return null;

  // MINIMIZED FLOATING PILL
  if (windowState === 'minimized') {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed z-50 select-none bg-slate-900/95 border border-amber-500/50 rounded-2xl p-2.5 px-4 shadow-2xl backdrop-blur-md flex items-center gap-3 cursor-grab active:cursor-grabbing text-xs text-white ${
          isDragging ? 'opacity-80 scale-102 ring-2 ring-amber-400' : ''
        }`}
      >
        <GripHorizontal className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-amber-300">Graph Tracker</span>
          <span className="text-slate-400">({activeVars.length} metrics)</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
          <button
            onClick={() => setWindowState('normal')}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Expand Graph View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Close Overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const overlayWidthClass = windowState === 'expanded' ? 'w-[880px]' : 'w-[640px]';

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 ${overlayWidthClass} max-w-[96vw] max-h-[92vh] flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-slate-100 font-sans transition-all duration-150 ${
        isDragging ? 'ring-2 ring-amber-400/80 opacity-95' : ''
      }`}
    >
      {/* 1. DRAGGABLE HEADER */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2.5">
          <GripHorizontal className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-sm tracking-wide text-white">Dynamic Variable Tracker</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Movable Overlay
            </span>
          </div>
        </div>

        {/* Window controls: Minimize, Expand/Normal, Close */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWindowState('minimized')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Minimize to floating pill"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setWindowState(prev => prev === 'expanded' ? 'normal' : 'expanded')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={windowState === 'expanded' ? 'Standard Width' : 'Expand Width'}
          >
            {windowState === 'expanded' ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition"
            title="Close overlay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SUB-HEADER: PRESET THEMES & TIME HORIZON TABS */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Preset theme chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {PRESET_THEMES.map(preset => {
            const isActive = preset.variableIds.every(id => selectedIds.includes(id)) && selectedIds.length === preset.variableIds.length;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Time horizon filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 ml-auto">
          {(['all', '12', '24'] as const).map(horizon => (
            <button
              key={horizon}
              onClick={() => setTimeHorizon(horizon)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                timeHorizon === horizon
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {horizon === 'all' ? 'All' : `Last ${horizon}M`}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ACTIVE VARIABLE CHIPS & SELECTOR */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Tracking ({activeVars.length}/6):
        </span>

        {activeVars.map(vDef => (
          <span
            key={vDef.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-slate-950/80 transition"
            style={{ borderColor: `${vDef.color}60`, color: '#f8fafc' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vDef.color }} />
            <span>{vDef.shortLabel}</span>
            {selectedIds.length > 1 && (
              <button
                onClick={() => handleToggleVariable(vDef.id)}
                className="text-slate-400 hover:text-rose-400 ml-0.5"
                title="Remove variable"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Add Variable Button / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Variable</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-2">
              <input
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {VARIABLE_CATALOG.filter(v => v.label.toLowerCase().includes(searchTerm.toLowerCase()) || v.category.toLowerCase().includes(searchTerm.toLowerCase())).map(vDef => {
                  const isChecked = selectedIds.includes(vDef.id);
                  return (
                    <div
                      key={vDef.id}
                      onClick={() => handleToggleVariable(vDef.id)}
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-amber-500/20 text-white font-medium'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vDef.color }} />
                        <span>{vDef.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{vDef.unit}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MAIN CHART AREA */}
      <div className="p-4 flex-1 min-h-[260px] max-h-[360px] bg-slate-950/30">
        {timelinePoints.length < 1 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
            No economic data points recorded yet.
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* 5. SUMMARY METRIC STRIP (Current, Delta, Min/Max) */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs min-w-[500px]">
          {stats.map(s => {
            const isPositive = s.delta > 0;
            return (
              <div
                key={s.def.id}
                className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span className="font-semibold truncate max-w-[120px]">{s.def.shortLabel}</span>
                  <span className="text-slate-500 font-mono">
                    Lo: {s.def.formatter(s.min)} • Hi: {s.def.formatter(s.max)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-data text-sm font-bold text-white">
                    {s.def.formatter(s.current)}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${
                    isPositive ? 'text-emerald-400' : (s.delta < 0 ? 'text-rose-400' : 'text-slate-400')
                  }`}>
                    {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : (s.delta < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null)}
                    <span>{s.delta > 0 ? `+${s.def.formatter(s.delta)}` : s.def.formatter(s.delta)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
