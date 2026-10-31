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
import { TrendingUp, CheckCircle2, BookOpen, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import analyticsService from "../services/analytics.service";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";

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

  // Task Status Chart Data with warm terracotta, sage, and stone palette
  const taskStatusChartData = [
    { name: "To Do", count: prodData?.statusCounts?.todo || 0, color: "#787165" },
    { name: "In Progress", count: prodData?.statusCounts?.in_progress || 0, color: "#E0693B" },
    { name: "Completed", count: prodData?.statusCounts?.completed || 0, color: "#2EA366" }
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
    backgroundColor: "#191816",
    borderColor: "#332F2A",
    borderRadius: "12px",
    color: "#FAF7F2",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
  };

  const totalTasks =
    (prodData?.statusCounts?.todo || 0) +
    (prodData?.statusCounts?.in_progress || 0) +
    (prodData?.statusCounts?.completed || 0);

  const completionRate =
    totalTasks > 0 ? Math.round(((prodData?.statusCounts?.completed || 0) / totalTasks) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-2 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E0693B] font-display">
            Data Visualizations
          </span>
          <Badge variant="primary" size="xs">
            Live Deterministic Analytics
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-[#FAF7F2] font-display">Productivity & Career Analytics</h1>
        <p className="text-xs text-[#9C9384] leading-relaxed">
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
          color="terracotta"
          icon={Target}
        />

        <StatCard
          label="Tasks Completed"
          value={prodData?.statusCounts?.completed || 0}
          subtext={`${totalTasks} total tasks`}
          color="sage"
          icon={CheckCircle2}
        />

        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          subtext={`${prodData?.statusCounts?.in_progress || 0} in progress`}
          color="amber"
          icon={TrendingUp}
        />

        <StatCard
          label="Subjects Tracked"
          value={studySubjectChartData.length}
          subtext="Active focus areas"
          color="white"
          icon={BookOpen}
        />
      </div>

      {/* Chart Row 1: Task Status Distribution & Study Time by Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#FAF7F2] font-display">Task Status Distribution</h3>
            <span className="text-xs text-[#9C9384] font-mono">{totalTasks} tasks</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusChartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={35}
                  paddingAngle={3}
                >
                  {taskStatusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  wrapperStyle={{ fontSize: "12px", color: "#CDC5B6" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study Hours by Subject */}
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#FAF7F2] font-display">Study Duration by Subject</h3>
            <span className="text-xs text-[#9C9384] font-mono">{studySubjectChartData.length} subjects</span>
          </div>
          {studySubjectChartData.length === 0 ? (
            <p className="text-xs text-[#787165] py-16 text-center">No study sessions recorded yet to chart.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studySubjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2925" />
                  <XAxis dataKey="subject" stroke="#9C9384" fontSize={11} />
                  <YAxis stroke="#9C9384" fontSize={11} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val) => [`${val} mins (${(val / 60).toFixed(1)} hrs)`, "Duration"]}
                  />
                  <Bar dataKey="minutes" fill="#E0693B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Chart Row 2: Skill Levels vs Target Requirements */}
      <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-[#FAF7F2] font-display">Skill Competency Level Comparison</h3>
            <p className="text-xs text-[#9C9384] mt-0.5">
              Current student rating vs required benchmark for {careerData?.targetRole}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#E0693B]">
              <span className="w-2.5 h-2.5 rounded bg-[#E0693B]" /> Current Level
            </span>
            <span className="flex items-center gap-1.5 text-[#CDC5B6]">
              <span className="w-2.5 h-2.5 rounded bg-[#645D54]" /> Required Level
            </span>
          </div>
        </div>

        {skillGapChartData.length === 0 ? (
          <p className="text-xs text-[#787165] py-12 text-center">No career skills data available.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillGapChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2925" />
                <XAxis dataKey="name" stroke="#9C9384" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} stroke="#9C9384" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="Current Level" fill="#E0693B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Required Level" fill="#645D54" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
