/**
 * SectionHeader — Page section header with eyebrow, title, description, and optional action.
 * Props: eyebrow, title, description, action, className
 */

import React from 'react';

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
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#4F7CFF]">
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className="font-display font-bold text-[#172033] text-xl sm:text-2xl leading-tight">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-xs sm:text-sm text-[#667085] font-sans leading-relaxed max-w-prose">
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
