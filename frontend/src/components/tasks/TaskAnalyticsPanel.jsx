import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  CheckCircle2,
  Flame,
  AlertTriangle,
  TrendingUp,
  PieChart as PieIcon
} from "lucide-react";

const PRIORITY_COLORS = {
  urgent: "#F43F5E",
  high: "#F97316",
  medium: "#4F7CFF",
  low: "#98A2B3"
};

export const TaskAnalyticsPanel = ({ analytics }) => {
  if (!analytics || !analytics.overview) {
    return (
      <div className="p-12 text-center text-xs text-[#667085] bg-white rounded-2xl border border-[#E7EAF0] shadow-xs">
        Loading analytics metrics...
      </div>
    );
  }

  const { overview, priorityCounts, categoryCounts, completionTrend, focusTime } = analytics;

  // Format priority pie data
  const priorityData = Object.keys(priorityCounts || {})
    .filter((k) => priorityCounts[k] > 0)
    .map((k) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: priorityCounts[k],
      color: PRIORITY_COLORS[k] || "#98A2B3"
    }));

  // Format category bar data
  const categoryData = Object.keys(categoryCounts || {}).map((cat) => ({
    category: cat,
    tasks: categoryCounts[cat]
  }));

  return (
    <div className="space-y-6">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#667085]">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
          </div>
          <span className="text-3xl font-extrabold text-[#172033] font-mono">
            {overview.completionRate}%
          </span>
          <p className="text-[10px] text-[#667085]">
            {overview.completedTasks} of {overview.totalTasks} tasks completed
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#667085]">This Week's Velocity</span>
            <TrendingUp className="w-4 h-4 text-[#4F7CFF]" />
          </div>
          <span className="text-3xl font-extrabold text-[#172033] font-mono">
            {overview.completedThisWeekCount}
          </span>
          <p className="text-[10px] text-[#667085]">Tasks completed in last 7 days</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#667085]">Active Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-3xl font-extrabold text-rose-600 font-mono">
            {overview.overdueCount}
          </span>
          <p className="text-[10px] text-[#667085]">Requires attention or rescheduling</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#667085]">Focus Time Logged</span>
            <Flame className="w-4 h-4 text-[#7C6CFA]" />
          </div>
          <span className="text-3xl font-extrabold text-[#172033] font-mono">
            {focusTime?.actualTotalMinutes || 0}m
          </span>
          <p className="text-[10px] text-[#667085]">
            vs {focusTime?.estimatedTotalMinutes || 0}m estimated
          </p>
        </div>
      </div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Velocity (7-Day Trend) */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4F7CFF]" />
              <h4 className="text-sm font-bold text-[#172033] font-display">
                7-Day Completion Velocity
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#667085]">Completed Tasks / Day</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#98A2B3" fontSize={11} tickLine={false} />
                <YAxis stroke="#98A2B3" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7EAF0",
                    borderRadius: "12px",
                    color: "#172033",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(16,24,40,0.08)"
                  }}
                  cursor={{ fill: "rgba(79, 124, 255, 0.06)" }}
                />
                <Bar dataKey="count" fill="#4F7CFF" radius={[6, 6, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown (Donut Chart) */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#7C6CFA]" />
              <h4 className="text-sm font-bold text-[#172033] font-display">Priority Distribution</h4>
            </div>
            <span className="text-[10px] font-mono text-[#667085]">Tasks by Priority</span>
          </div>

          {priorityData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#98A2B3]">
              No active priority tasks to display.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E7EAF0",
                      borderRadius: "12px",
                      color: "#172033",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(16,24,40,0.08)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {priorityData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[#667085]">{p.name}:</span>
                <span className="font-bold text-[#172033]">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#172033] font-display">Workload by Subject / Category</h4>
            <span className="text-[10px] font-mono text-[#667085]">Total Categories: {categoryData.length}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoryData.map((c) => (
              <div key={c.category} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E7EAF0] space-y-1">
                <span className="text-xs font-semibold text-[#667085] block truncate">{c.category}</span>
                <span className="text-lg font-bold text-[#172033] font-mono">{c.tasks} tasks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAnalyticsPanel;
