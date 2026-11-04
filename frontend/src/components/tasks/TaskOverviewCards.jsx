import React from "react";
import { Clock, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";

export const TaskOverviewCards = ({
  stats = {
    dueToday: 0,
    overdue: 0,
    upcoming: 0,
    completedThisWeek: 0
  },
  activeFilter = "",
  onSelectFilter
}) => {
  const cards = [
    {
      id: "today",
      label: "Due Today",
      count: stats.dueToday,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800/40",
      activeBorder: "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20"
    },
    {
      id: "overdue",
      label: "Overdue",
      count: stats.overdue,
      icon: AlertTriangle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-800/40",
      activeBorder: "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-500/20"
    },
    {
      id: "upcoming",
      label: "Upcoming",
      count: stats.upcoming,
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800/40",
      activeBorder: "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
    },
    {
      id: "this_week",
      label: "Completed This Week",
      count: stats.completedThisWeek,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800/40",
      activeBorder: "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeFilter === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectFilter(isActive ? "" : c.id)}
            className={`p-4 rounded-2xl bg-white dark:bg-[#111827] text-left transition-all duration-150 cursor-pointer group flex items-center justify-between border shadow-sm hover:-translate-y-0.5 ${
              isActive
                ? c.activeBorder
                : "border-[#E7EAF0] dark:border-[#1F2937] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#667085] dark:text-slate-400 truncate">
                  {c.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Active Filter" />
                )}
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#172033] dark:text-white font-mono tracking-tight block">
                {c.count}
              </span>
            </div>

            <div
              className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} ${c.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-2xs`}
            >
              <Icon className="w-4 h-4" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TaskOverviewCards;
