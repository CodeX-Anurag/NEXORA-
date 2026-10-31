/**
 * Badge — reusable chip/badge for status, category, and label displays.
 * Variants: "success" | "warning" | "danger" | "info" | "muted" | "primary" | "accent"
 * Sizes:    "xs" | "sm" | "md"
 */

const variantClasses = {
  success: 'bg-[#2EA366]/10 text-[#2EA366] border-[#2EA366]/30',
  warning: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  danger:  'bg-rose-950/40 text-rose-300 border-rose-800/40',
  info:    'bg-sky-950/40 text-sky-300 border-sky-800/40',
  primary: 'bg-[#E0693B]/10 text-[#E0693B] border-[#E0693B]/30',
  accent:  'bg-indigo-950/40 text-indigo-300 border-indigo-800/40',
  muted:   'bg-[#22201D] text-[#9C9384] border-[#2D2925]',
};

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-sm px-2.5 py-1 gap-2',
};

const dotVariantClasses = {
  success: 'bg-[#2EA366]',
  warning: 'bg-amber-300',
  danger:  'bg-rose-300',
  info:    'bg-sky-300',
  primary: 'bg-[#E0693B]',
  accent:  'bg-indigo-300',
  muted:   'bg-[#9C9384]',
};

export function Badge({
  variant = 'muted',
  size = 'sm',
  children,
  className = '',
  dot = false,
}) {
  const base =
    'inline-flex items-center font-mono font-medium rounded-full border leading-none';
  const vClass = variantClasses[variant] ?? variantClasses.muted;
  const sClass = sizeClasses[size] ?? sizeClasses.sm;

  return (
    <span className={`${base} ${vClass} ${sClass} ${className}`}>
      {dot && (
        <span
          className={`shrink-0 rounded-full animate-pulse ${dotVariantClasses[variant] ?? 'bg-[#9C9384]'} ${
            size === 'xs' ? 'w-1 h-1' : 'w-1.5 h-1.5'
          }`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
