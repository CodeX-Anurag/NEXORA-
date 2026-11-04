/**
 * TabNav — Horizontal pill-tab navigation bar.
 * Props: tabs, activeTab, onTabChange, className
 * tabs: Array<{ id: string, label: string, icon?: LucideComponent, badge?: string|number }>
 */

import React from 'react';

export function TabNav({ tabs = [], activeTab, onTabChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 flex-wrap p-1 bg-[#F8FAFC] rounded-2xl border border-[#E7EAF0] ${className}`}
    >
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const isActive = id === activeTab;

        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange?.(id)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium
              transition-all duration-150 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#4F7CFF]/30 whitespace-nowrap cursor-pointer
              ${
                isActive
                  ? 'bg-white text-[#4F7CFF] font-semibold shadow-sm border border-[#E7EAF0]'
                  : 'text-[#667085] hover:text-[#172033] hover:bg-white/60 border border-transparent'
              }`}
          >
            {Icon && <Icon size={15} />}
            {label}
            {badge !== undefined && badge !== null && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5
                  rounded-full text-[10px] font-mono font-bold
                  ${isActive
                    ? 'bg-[#EEF2FF] text-[#4F7CFF]'
                    : 'bg-[#E7EAF0] text-[#667085]'}`}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabNav;
