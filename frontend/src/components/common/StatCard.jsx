/**
 * StatCard — KPI metric card with optional trend indicator.
 * Props: label, value, subtext, trend, trendDir, color, icon, onClick, className
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function useAnimatedCounter(rawValue) {
  const [displayValue, setDisplayValue] = React.useState(rawValue);

  React.useEffect(() => {
    if (
      typeof window === 'undefined' ||
      import.meta.env?.MODE === 'test' ||
      rawValue === null ||
      rawValue === undefined
    ) {
      setDisplayValue(rawValue);
      return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(rawValue);
      return;
    }

    const str = String(rawValue).trim();
    const match = str.match(/^([^0-9.-]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) {
      setDisplayValue(rawValue);
      return;
    }

    const prefix = match[1];
    const target = parseFloat(match[2]);
    const suffix = match[3];
    const hasDecimals = match[2].includes('.');
    const decimalPlaces = hasDecimals ? match[2].split('.')[1].length : 0;

    const start = 0;
    const duration = 350;
    let startTime = null;
    let animFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * ease;
      const formatted = `${prefix}${decimalPlaces > 0 ? current.toFixed(decimalPlaces) : Math.round(current)}${suffix}`;
      setDisplayValue(formatted);

      if (progress < 1) {
        animFrame = typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame(step) : null;
      } else {
        setDisplayValue(rawValue);
      }
    };

    animFrame = typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame(step) : null;
    return () => {
      if (animFrame && typeof window !== 'undefined' && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(animFrame);
      }
    };
  }, [rawValue]);

  return displayValue;
}

const colorMap = {
  terracotta: {
    accent: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200/80 dark:border-blue-800/50',
    topBar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  },
  primary: {
    accent: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200/80 dark:border-blue-800/50',
    topBar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  },
  blue: {
    accent: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200/80 dark:border-blue-800/50',
    topBar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  },
  secondary: {
    accent: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    border: 'border-violet-200/80 dark:border-violet-800/50',
    topBar: 'bg-gradient-to-r from-violet-500 to-purple-500',
  },
  violet: {
    accent: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    border: 'border-violet-200/80 dark:border-violet-800/50',
    topBar: 'bg-gradient-to-r from-violet-500 to-purple-500',
  },
  purple: {
    accent: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    border: 'border-violet-200/80 dark:border-violet-800/50',
    topBar: 'bg-gradient-to-r from-violet-500 to-purple-500',
  },
  sage: {
    accent: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200/80 dark:border-emerald-800/50',
    topBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  },
  emerald: {
    accent: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200/80 dark:border-emerald-800/50',
    topBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  },
  amber: {
    accent: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200/80 dark:border-amber-800/50',
    topBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
  },
  rose: {
    accent: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200/80 dark:border-rose-800/50',
    topBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
  },
  coral: {
    accent: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200/80 dark:border-rose-800/50',
    topBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
  },
  danger: {
    accent: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200/80 dark:border-rose-800/50',
    topBar: 'bg-gradient-to-r from-rose-500 to-red-500',
  },
  cyan: {
    accent: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/50',
    border: 'border-cyan-200/80 dark:border-cyan-800/50',
    topBar: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  },
  indigo: {
    accent: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    border: 'border-indigo-200/80 dark:border-indigo-800/50',
    topBar: 'bg-gradient-to-r from-indigo-500 to-violet-500',
  },
  white: {
    accent: 'text-[#172033] dark:text-[#F8FAFC]',
    iconBg: 'bg-[#F8FAFC] dark:bg-[#1A2333]',
    border: 'border-[#E7EAF0] dark:border-[#1F2937]',
    topBar: 'bg-slate-300 dark:bg-slate-700',
  },
};

export function StatCard({
  label,
  value,
  subtext,
  trend,
  trendDir = 'up',
  color = 'white',
  icon: Icon,
  onClick,
  className = '',
}) {
  const c = colorMap[color] ?? colorMap.white;
  const isUp = trendDir === 'up';
  const animatedValue = useAnimatedCounter(value);

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`relative rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(16,24,40,0.04)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-[#D0D5DD] dark:hover:border-[#374151] active:scale-[0.99]' : ''
      } ${className}`}
    >
      {/* Top accent highlight */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${c.topBar}`} />
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-[#667085] dark:text-slate-400 leading-tight">{label}</p>
        {Icon && (
          <span
            className={`flex items-center justify-center w-9 h-9 rounded-xl ${c.iconBg} border ${c.border} shrink-0 transition-transform duration-200 hover:scale-105`}
          >
            <Icon size={18} className={c.accent} />
          </span>
        )}
      </div>

      {/* Value */}
      <p className={`font-mono text-2xl sm:text-3xl font-bold ${c.accent} leading-none tracking-tight`}>
        {animatedValue}
      </p>

      {/* Footer */}
      {(subtext || trend) && (
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-[#F1F4F9] dark:border-[#1F2937]">
          {subtext && (
            <span className="text-xs text-[#667085] dark:text-slate-400 truncate font-sans">{subtext}</span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-mono font-semibold shrink-0
                ${isUp ? 'text-[#12B76A]' : 'text-[#F04438]'}`}
            >
              {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
