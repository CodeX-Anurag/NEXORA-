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
  high: "#FB7185",
  medium: "#FBBF24",
  low: "#787165"
};

export const TaskAnalyticsPanel = ({ analytics }) => {
  if (!analytics || !analytics.overview) {
    return (
      <div className="p-12 text-center text-xs text-[#9C9384] bg-[#191816] rounded-2xl border border-[#2D2925]">
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
      color: PRIORITY_COLORS[k] || "#787165"
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
        <div className="p-5 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#9C9384]">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#2EA366]" />
          </div>
          <span className="text-3xl font-extrabold text-[#FAF7F2] font-mono">
            {overview.completionRate}%
          </span>
          <p className="text-[10px] text-[#9C9384]">
            {overview.completedTasks} of {overview.totalTasks} tasks completed
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#9C9384]">This Week's Velocity</span>
            <TrendingUp className="w-4 h-4 text-[#E0693B]" />
          </div>
          <span className="text-3xl font-extrabold text-[#FAF7F2] font-mono">
            {overview.completedThisWeekCount}
          </span>
          <p className="text-[10px] text-[#9C9384]">Tasks completed in last 7 days</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#9C9384]">Active Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-3xl font-extrabold text-rose-400 font-mono">
            {overview.overdueCount}
          </span>
          <p className="text-[10px] text-[#9C9384]">Requires attention or rescheduling</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#9C9384]">Focus Time Logged</span>
            <Flame className="w-4 h-4 text-[#E0693B]" />
          </div>
          <span className="text-3xl font-extrabold text-[#FAF7F2] font-mono">
            {focusTime?.actualTotalMinutes || 0}m
          </span>
          <p className="text-[10px] text-[#9C9384]">
            vs {focusTime?.estimatedTotalMinutes || 0}m estimated
          </p>
        </div>
      </div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Velocity (7-Day Trend) */}
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E0693B]" />
              <h4 className="text-sm font-bold text-[#FAF7F2] font-display">
                7-Day Completion Velocity
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#9C9384]">Completed Tasks / Day</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#787165" fontSize={11} tickLine={false} />
                <YAxis stroke="#787165" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161513",
                    border: "1px solid #332F2A",
                    borderRadius: "12px",
                    color: "#FAF7F2",
                    fontSize: "12px"
                  }}
                  cursor={{ fill: "rgba(224, 105, 59, 0.08)" }}
                />
                <Bar dataKey="count" fill="#E0693B" radius={[6, 6, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown (Donut Chart) */}
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#E0693B]" />
              <h4 className="text-sm font-bold text-[#FAF7F2] font-display">Priority Distribution</h4>
            </div>
            <span className="text-[10px] font-mono text-[#9C9384]">Tasks by Priority</span>
          </div>

          {priorityData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#787165]">
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
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#191816" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161513",
                      border: "1px solid #332F2A",
                      borderRadius: "12px",
                      color: "#FAF7F2",
                      fontSize: "12px"
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
                <span className="text-[#CDC5B6]">{p.name}:</span>
                <span className="font-bold text-[#FAF7F2]">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#FAF7F2] font-display">Workload by Subject / Category</h4>
            <span className="text-[10px] font-mono text-[#9C9384]">Total Categories: {categoryData.length}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoryData.map((c) => (
              <div key={c.category} className="p-3.5 rounded-xl bg-[#141312] border border-[#262420] space-y-1">
                <span className="text-xs font-semibold text-[#CDC5B6] block truncate">{c.category}</span>
                <span className="text-lg font-bold text-[#FAF7F2] font-mono">{c.tasks} tasks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAnalyticsPanel;
