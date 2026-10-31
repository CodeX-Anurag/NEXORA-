/**
 * SectionHeader — Page section header with eyebrow, title, description, and optional action.
 * Props: eyebrow, title, description, action, className
 */

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      {/* Text block */}
      <div className="flex flex-col gap-1 min-w-0">
        {eyebrow && (
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#E0693B]">
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className="font-display font-bold text-[#FAF7F2] text-lg leading-tight">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-xs text-[#9C9384] font-sans leading-relaxed max-w-prose">
            {description}
          </p>
        )}
      </div>

      {/* Optional action slot */}
      {action && (
        <div className="shrink-0 flex items-center">{action}</div>
      )}
    </div>
  );
}

export default SectionHeader;
