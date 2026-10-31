/**
 * StatCard — KPI metric card with optional trend indicator.
 * Props: label, value, subtext, trend, trendDir, color, icon, onClick, className
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  terracotta: {
    accent: 'text-[#E0693B]',
    iconBg: 'bg-[#E0693B]/10',
    border:  'border-[#E0693B]/20',
  },
  sage: {
    accent: 'text-[#2EA366]',
    iconBg: 'bg-[#2EA366]/10',
    border:  'border-[#2EA366]/20',
  },
  amber: {
    accent: 'text-amber-300',
    iconBg: 'bg-amber-950/40',
    border:  'border-amber-800/30',
  },
  white: {
    accent: 'text-[#FAF7F2]',
    iconBg: 'bg-[#25221F]',
    border:  'border-[#2D2925]',
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

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`relative rounded-2xl border border-[#2D2925] bg-[#141312] p-4 flex flex-col gap-3
        ${onClick ? 'cursor-pointer hover:border-[#38332E] transition-colors' : ''}
        ${className}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-sans text-[#9C9384] leading-tight">{label}</p>
        {Icon && (
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-lg ${c.iconBg} border ${c.border}`}
          >
            <Icon size={16} className={c.accent} />
          </span>
        )}
      </div>

      {/* Value */}
      <p className={`font-mono text-2xl font-bold ${c.accent} leading-none`}>
        {value}
      </p>

      {/* Footer */}
      {(subtext || trend) && (
        <div className="flex items-center justify-between gap-2 mt-auto">
          {subtext && (
            <span className="text-[11px] text-[#9C9384] font-sans">{subtext}</span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-medium
                ${isUp ? 'text-[#2EA366]' : 'text-rose-400'}`}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
