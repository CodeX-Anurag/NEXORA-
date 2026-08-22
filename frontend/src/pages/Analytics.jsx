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
  Cell
} from "recharts";
import { useAuth } from "../context/AuthContext";
import analyticsService from "../services/analytics.service";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const Analytics = () => {
  const { accessToken } = useAuth();

  const [prodData, setProdData] = useState(null);
  const [careerData, setCareerData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");

    try {
      const [prodRes, careerRes] = await Promise.all([
        analyticsService.getProductivityAnalytics(accessToken),
        analyticsService.getCareerAnalytics(accessToken)
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

  // Task Status Chart Data
  const taskStatusChartData = [
    { name: "To Do", count: prodData?.statusCounts?.todo || 0, color: "#64748b" },
    { name: "In Progress", count: prodData?.statusCounts?.in_progress || 0, color: "#6366f1" },
    { name: "Completed", count: prodData?.statusCounts?.completed || 0, color: "#10b981" }
  ];

  // Subject Study Distribution Data
  const studySubjectChartData = prodData?.studyBySubject || [];

  // Skill Gap Comparison Data
  const skillGapChartData = (careerData?.skillGaps || []).map((s) => ({
    name: s.skillName,
    "Current Level": s.currentLevel,
    "Required Level": s.requiredLevel
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Recharts Visualizations</span>
        <h1 className="text-2xl font-bold text-slate-100">Productivity & Career Analytics</h1>
        <p className="text-xs text-slate-400">
          Deterministic backend calculations mapping task completion velocity, study duration per subject, and target role skill gap progress.
        </p>
      </div>

      {error && <ErrorMessage title="Analytics Error" message={error} onRetry={fetchAnalytics} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Career Readiness</span>
          <p className="text-3xl font-extrabold text-indigo-400 font-mono">{careerData?.careerReadinessScore || 0}%</p>
          <p className="text-[11px] text-slate-500">Target Role: {careerData?.targetRole}</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Task Completion</span>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">
            {prodData?.statusCounts?.completed || 0} Finished
          </p>
          <p className="text-[11px] text-slate-500">{prodData?.statusCounts?.todo || 0} To Do / {prodData?.statusCounts?.in_progress || 0} In Progress</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Subjects Tracked</span>
          <p className="text-3xl font-extrabold text-cyan-400 font-mono">{studySubjectChartData.length}</p>
          <p className="text-[11px] text-slate-500">Active focus subjects</p>
        </div>
      </div>

      {/* Chart Row 1: Task Status Distribution & Study Time by Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-semibold text-slate-100">Task Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {taskStatusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study Hours by Subject */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-semibold text-slate-100">Study Duration by Subject (Minutes)</h3>
          {studySubjectChartData.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No study sessions recorded yet to chart.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studySubjectChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                  <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Chart Row 2: Skill Levels vs Target Requirements */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Skill Competency Level Comparison</h3>
            <p className="text-xs text-slate-400">Current student rating vs required benchmark for {careerData?.targetRole}</p>
          </div>
        </div>

        {skillGapChartData.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No career skills data available.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillGapChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="Current Level" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Required Level" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
