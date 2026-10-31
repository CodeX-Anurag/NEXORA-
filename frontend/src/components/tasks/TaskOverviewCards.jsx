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
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      activeBg: "bg-amber-950/20 border-amber-500/50 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30"
    },
    {
      id: "overdue",
      label: "Overdue",
      count: stats.overdue,
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      activeBg: "bg-rose-950/20 border-rose-500/50 shadow-sm shadow-rose-500/10 ring-1 ring-rose-500/30"
    },
    {
      id: "upcoming",
      label: "Upcoming",
      count: stats.upcoming,
      icon: Calendar,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      activeBg: "bg-blue-950/20 border-blue-500/50 shadow-sm shadow-blue-500/10 ring-1 ring-blue-500/30"
    },
    {
      id: "this_week",
      label: "Completed This Week",
      count: stats.completedThisWeek,
      icon: CheckCircle2,
      color: "text-[#2EA366]",
      bg: "bg-[#2EA366]/10",
      border: "border-[#2EA366]/20",
      activeBg: "bg-emerald-950/20 border-[#2EA366]/50 shadow-sm shadow-[#2EA366]/10 ring-1 ring-[#2EA366]/30"
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
            className={`p-3.5 sm:p-4 rounded-xl bg-[#191816] text-left transition-all cursor-pointer group flex items-center justify-between border ${
              isActive ? c.activeBg : "border-[#2D2925] hover:border-[#3E3832] hover:bg-[#1E1C19]"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#9C9384] truncate">
                  {c.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E0693B] shrink-0" title="Active Filter" />
                )}
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#FAF7F2] font-mono tracking-tight block">
                {c.count}
              </span>
            </div>

            <div
              className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} ${c.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
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
