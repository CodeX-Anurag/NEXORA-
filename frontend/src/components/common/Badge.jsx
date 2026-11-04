/**
 * Badge — reusable chip/badge for status, category, and label displays.
 * Variants: "success" | "warning" | "danger" | "info" | "muted" | "primary" | "secondary" | "accent"
 * Sizes:    "xs" | "sm" | "md"
 */

import React from 'react';

const variantClasses = {
  success: 'bg-[#ECFDF3] dark:bg-emerald-950/40 text-[#027A48] dark:text-emerald-300 border-[#A6F4C5] dark:border-emerald-800/40',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
  warning: 'bg-[#FFFAEB] dark:bg-amber-950/40 text-[#B54708] dark:text-amber-300 border-[#FEDF89] dark:border-amber-800/40',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
  danger:  'bg-[#FEF3F2] dark:bg-rose-950/40 text-[#B42318] dark:text-rose-300 border-[#FECDCA] dark:border-rose-800/40',
  rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
  info:    'bg-[#F0F9FF] dark:bg-sky-950/40 text-[#026AA2] dark:text-sky-300 border-[#B9E6FE] dark:border-sky-800/40',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40',
  primary: 'bg-[#EEF2FF] dark:bg-blue-950/40 text-[#3538CD] dark:text-blue-300 border-[#C7D7FE] dark:border-blue-800/40',
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
  secondary: 'bg-[#F5F3FF] dark:bg-violet-950/40 text-[#6941C6] dark:text-violet-300 border-[#D9D6FE] dark:border-violet-800/40',
  violet: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40',
  purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
  accent:  'bg-[#F5F3FF] dark:bg-violet-950/40 text-[#6941C6] dark:text-violet-300 border-[#D9D6FE] dark:border-violet-800/40',
  muted:   'bg-[#F8FAFC] dark:bg-slate-800/50 text-[#667085] dark:text-slate-300 border-[#E7EAF0] dark:border-slate-700',
};

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-sm px-2.5 py-1 gap-2',
};

const dotVariantClasses = {
  success: 'bg-[#12B76A]',
  emerald: 'bg-[#10B981]',
  warning: 'bg-[#F79009]',
  amber: 'bg-[#F59E0B]',
  danger:  'bg-[#F04438]',
  rose: 'bg-[#F43F5E]',
  info:    'bg-[#0BA5EC]',
  cyan: 'bg-[#06B6D4]',
  primary: 'bg-[#4F7CFF]',
  blue: 'bg-[#3B82F6]',
  secondary: 'bg-[#7C6CFA]',
  violet: 'bg-[#8B5CF6]',
  purple: 'bg-[#8B5CF6]',
  accent:  'bg-[#7C6CFA]',
  muted:   'bg-[#98A2B3]',
};

export function Badge({
  variant = 'muted',
  size = 'sm',
  children,
  className = '',
  dot = false,
}) {
  const base =
    'inline-flex items-center font-sans font-medium rounded-full border leading-none transition-all';
  const vClass = variantClasses[variant] ?? variantClasses.muted;
  const sClass = sizeClasses[size] ?? sizeClasses.sm;

  return (
    <span className={`${base} ${vClass} ${sClass} ${className}`}>
      {dot && (
        <span
          className={`shrink-0 rounded-full animate-pulse ${dotVariantClasses[variant] ?? 'bg-[#98A2B3]'} ${
            size === 'xs' ? 'w-1 h-1' : 'w-1.5 h-1.5'
          }`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
