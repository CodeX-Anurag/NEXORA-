/**
 * TabNav — Horizontal pill-tab navigation bar.
 * Props: tabs, activeTab, onTabChange, className
 * tabs: Array<{ id: string, label: string, icon?: LucideComponent, badge?: string|number }>
 */

export function TabNav({ tabs = [], activeTab, onTabChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 flex-wrap ${className}`}
    >
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const isActive = id === activeTab;

        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange?.(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-sans
              transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#E0693B]/50 whitespace-nowrap
              ${
                isActive
                  ? 'bg-[#25221F] text-[#FAF7F2] border border-[#38332E]'
                  : 'text-[#9C9384] hover:text-[#FAF7F2] border border-transparent'
              }`}
          >
            {Icon && <Icon size={14} />}
            {label}
            {badge !== undefined && badge !== null && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                  rounded-full text-[10px] font-mono font-bold
                  ${isActive
                    ? 'bg-[#E0693B]/20 text-[#E0693B]'
                    : 'bg-[#22201D] text-[#9C9384]'}`}
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
