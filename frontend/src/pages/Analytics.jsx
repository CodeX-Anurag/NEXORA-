import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, CheckCircle2, BookOpen, Target, BarChart2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import analyticsService from "../services/analytics.service";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import { getSubjectTheme } from "../utils/colorSystem";

export const Analytics = () => {
  const { accessToken } = useAuth();

  const [prodData, setProdData] = useState(null);
  const [careerData, setCareerData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const [prodRes, careerRes] = await Promise.all([
        analyticsService.getProductivityAnalytics(accessToken).catch(() => null),
        analyticsService.getCareerAnalytics(accessToken).catch(() => null)
      ]);

      setProdData(prodRes);
      setCareerData(careerRes);
    } catch (err) {
      setError(err.message || "Failed to load analytics trends.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return <Loader text="Generating deterministic analytics charts..." />;
  }

  // Task Status Chart Data with modern multi-color palette
  const taskStatusChartData = [
    { name: "To Do", count: prodData?.statusCounts?.todo || 0, color: "#64748B" },
    { name: "In Progress", count: prodData?.statusCounts?.in_progress || 0, color: "#06B6D4" },
    { name: "Completed", count: prodData?.statusCounts?.completed || 0, color: "#10B981" }
  ];

  // Subject Study Distribution Data
  const studySubjectChartData = prodData?.studyBySubject || [];

  // Skill Gap Comparison Data
  const skillGapChartData = (careerData?.skillGaps || []).map((s) => ({
    name: s.skillName,
    "Current Level": s.currentLevel,
    "Required Level": s.requiredLevel
  }));

  const tooltipStyle = {
    backgroundColor: "#111827",
    borderColor: "#374151",
    borderRadius: "12px",
    color: "#F3F4F6",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
  };

  const totalTasks =
    (prodData?.statusCounts?.todo || 0) +
    (prodData?.statusCounts?.in_progress || 0) +
    (prodData?.statusCounts?.completed || 0);

  const completionRate =
    totalTasks > 0 ? Math.round(((prodData?.statusCounts?.completed || 0) / totalTasks) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-indigo-200/60 dark:border-indigo-900/40 space-y-2 shadow-sm overflow-hidden">
        {/* Top Indigo/Violet accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-sans flex items-center gap-1">
            <BarChart2 size={13} /> Visual Telemetry
          </span>
          <Badge variant="emerald" size="xs" withDot>
            Live Deterministic Analytics
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-slate-100 font-display tracking-tight">Productivity &amp; Career Analytics</h1>
        <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
          Deterministic backend calculations mapping task completion velocity, study duration per subject, and target role skill gap progress.
        </p>
      </div>

      {error && <ErrorMessage title="Analytics Error" message={error} onRetry={fetchAnalytics} />}

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Career Readiness"
          value={`${careerData?.careerReadinessScore || 0}%`}
          subtext={`Target: ${careerData?.targetRole || "Role"}`}
          color="emerald"
          icon={Target}
        />
        <StatCard
          label="Task Completion Rate"
          value={`${completionRate}%`}
          subtext={`${prodData?.statusCounts?.completed || 0} of ${totalTasks} tasks`}
          color="blue"
          icon={CheckCircle2}
        />
        <StatCard
          label="Total Study Focus"
          value={`${((prodData?.totalStudyMinutes || 0) / 60).toFixed(1)} hrs`}
          subtext={`${prodData?.totalStudySessions || 0} logged blocks`}
          color="amber"
          icon={BookOpen}
        />
        <StatCard
          label="Critical Skill Gaps"
          value={careerData?.criticalGapsCount || 0}
          subtext="Requires focus study"
          color="rose"
          icon={TrendingUp}
        />
      </div>

      {/* Chart Section 1: Study Duration & Task Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Study by Subject Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 font-display">Study Focus by Subject</h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">Multi-color distribution of logged focus hours</p>
            </div>
            <Badge variant="violet" size="xs">
              {studySubjectChartData.length} Subjects
            </Badge>
          </div>

          <div className="h-64 w-full">
            {studySubjectChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#98A2B3] dark:text-slate-500">
                No study sessions recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studySubjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="subject" stroke="#667085" fontSize={11} interval={0} />
                  <YAxis stroke="#667085" fontSize={11} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val) => [`${val} mins (${(val / 60).toFixed(1)} hrs)`, "Study Time"]}
                  />
                  <Bar dataKey="totalMinutes" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800}>
                    {studySubjectChartData.map((entry, index) => {
                      const theme = getSubjectTheme(entry.subject);
                      return <Cell key={`cell-${index}`} fill={theme.hex} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task Status Distribution Pie Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 font-display">Task Status Distribution</h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">Current velocity across pipeline states</p>
            </div>
            <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800/40">
              {totalTasks} Total Tasks
            </span>
          </div>

          <div className="h-64 w-full">
            {totalTasks === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#98A2B3] dark:text-slate-500">
                No tasks available to graph.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    isAnimationActive
                    animationDuration={800}
                  >
                    {taskStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-[#667085] dark:text-slate-400 ml-1 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section 2: Skill Gaps vs Required Benchmark */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 font-display">Skill Competency vs Target Benchmark</h3>
            <p className="text-xs text-[#667085] dark:text-slate-400">Current proficiency ratings compared to required role standards</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded bg-[#06B6D4]" /> Current Level
            </span>
            <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded bg-[#8B5CF6]" /> Required Benchmark
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {skillGapChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#98A2B3] dark:text-slate-500">
              No skill benchmarks mapped for this target role.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillGapChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#667085" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#667085" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="Current Level" fill="#06B6D4" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                <Bar dataKey="Required Level" fill="#8B5CF6" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
