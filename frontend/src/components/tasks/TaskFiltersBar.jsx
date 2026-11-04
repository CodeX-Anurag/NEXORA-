import React from "react";
import {
  Search,
  X,
  List,
  Columns3,
  Calendar,
  BarChart3,
  RotateCcw,
  Sun
} from "lucide-react";

export const TaskFiltersBar = ({
  search = "",
  onSearchChange,
  statusFilter = "",
  onStatusChange,
  priorityFilter = "",
  onPriorityChange,
  categoryFilter = "",
  onCategoryChange,
  sortBy = "dueDate_asc",
  onSortChange,
  activeView = "list",
  onViewChange,
  categories = [],
  activeQuickFilter = "",
  onResetFilters
}) => {
  // Count how many filters are currently active
  let activeFilterCount = 0;
  if (search) activeFilterCount++;
  if (statusFilter) activeFilterCount++;
  if (priorityFilter) activeFilterCount++;
  if (categoryFilter) activeFilterCount++;
  if (activeQuickFilter) activeFilterCount++;
  if (sortBy !== "dueDate_asc") activeFilterCount++;

  const hasActiveFilters = activeFilterCount > 0;

  const views = [
    { id: "list", label: "List", icon: List },
    { id: "my_day", label: "My Day", icon: Sun },
    { id: "kanban", label: "Board", icon: Columns3 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 }
  ];

  return (
    <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-sm space-y-3">
      {/* Top Row: Search Input & View Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#98A2B3] dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, or tags..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E7EAF0] dark:border-[#1F2937] rounded-xl pl-9 pr-8 py-2 text-xs text-[#172033] dark:text-white placeholder-[#98A2B3] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#172033] dark:hover:text-white p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[#F1F4F9] dark:bg-[#161F30] p-1 rounded-xl border border-[#E7EAF0] dark:border-[#1F2937] overflow-x-auto shrink-0">
          {views.map((v) => {
            const Icon = v.icon;
            const isSelected = activeView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewChange(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-[#111827] text-amber-600 dark:text-amber-400 shadow-2xs border border-[#E7EAF0] dark:border-slate-700"
                    : "text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${v.id === "my_day" && isSelected ? "text-violet-500" : ""}`} />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Granular Filters & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#F1F4F9] dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E7EAF0] rounded-lg text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E7EAF0] rounded-lg text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E7EAF0] rounded-lg text-[#172033] focus:outline-none focus:border-[#4F7CFF] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort & Reset Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[#667085] hidden md:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E7EAF0] rounded-lg text-[#172033] focus:outline-none focus:border-[#4F7CFF] font-medium cursor-pointer"
          >
            <option value="dueDate_asc">Due Date (Earliest)</option>
            <option value="dueDate_desc">Due Date (Latest)</option>
            <option value="priority">Priority (Highest)</option>
            <option value="newest">Recently Created</option>
            <option value="updated">Recently Updated</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#4F7CFF] hover:bg-[#EEF2FF] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskFiltersBar;
