import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  FolderKanban,
  ArrowRight,
  Mic,
  Zap,
  Target,
  Calendar,
  BookOpen,
  BarChart2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import analyticsService from "../services/analytics.service";
import dashboardService from "../services/dashboard.service";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Button from "../components/common/Button";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import RecommendationsWidget from "../components/ai/RecommendationsWidget";
import { getSubjectTheme } from "../utils/colorSystem";

export const Dashboard = () => {
  const { user, accessToken } = useAuth();

  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [productivityDetails, setProductivityDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const [analyticsRes, overviewRes, prodRes] = await Promise.allSettled([
        analyticsService.getDashboardAnalytics(accessToken),
        dashboardService.getOverview(accessToken),
        analyticsService.getProductivityAnalytics(accessToken)
      ]);

      if (analyticsRes.status === "fulfilled") {
        setData(analyticsRes.value);
      }
      if (overviewRes.status === "fulfilled") {
        setOverview(overviewRes.value);
      }
      if (prodRes.status === "fulfilled") {
        setProductivityDetails(prodRes.value);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard overview.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <Loader text="Calculating productivity, study, & career readiness metrics..." />;
  }

  const prod = data?.productivity || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    totalStudyHours: 0
  };
  const career = data?.career || {
    targetRole: "Full Stack Developer",
    careerReadinessScore: 0,
    criticalGapsCount: 0,
    acquiredSkillsCount: 0
  };
  const projects = data?.projects || { totalProjects: 0, completedProjects: 0 };

  const recentTasks = overview?.recentTasks || [];
  const recentStudySessions = overview?.recentStudySessions || [];
  const studyBySubject = productivityDetails?.studyBySubject || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Welcome Command Center Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-blue-200/60 dark:border-blue-900/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle top multi-color accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              Command Center
            </span>
            <Badge variant="blue" size="xs">
              Live Real-Time Telemetry
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white font-display tracking-tight">
            Welcome back, <span className="text-blue-600 dark:text-blue-400">{user?.name || "Student"}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 flex items-center gap-2 flex-wrap">
            Targeting Role:{" "}
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 text-xs">
              {career.targetRole}
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">
              {career.careerReadinessScore}% Career Ready
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          <Link to="/viva">
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-500/20"
            >
              <Mic size={15} />
              <span>AI Oral Viva</span>
            </Button>
          </Link>
          <Link to="/tasks?view=my_day">
            <Button variant="secondary" size="sm" className="text-amber-600 dark:text-amber-400 hover:border-amber-300">
              Today's Tasks
            </Button>
          </Link>
          <Link to="/study">
            <Button variant="secondary" size="sm" className="text-violet-600 dark:text-violet-400 hover:border-violet-300">
              + Log Study
            </Button>
          </Link>
          <Link to="/ai-coach">
            <Button variant="secondary" size="sm" className="text-purple-600 dark:text-purple-400 hover:border-purple-300">
              AI Coach
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorMessage title="Dashboard Analytics Error" message={error} onRetry={fetchDashboardData} />}

      {/* 2. Distinct Colorful Productivity KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Productivity Rate"
          value={`${prod.completionRate}%`}
          subtext={`${prod.completedTasks} of ${prod.totalTasks} tasks done`}
          color="blue"
          icon={CheckCircle2}
        />

        <StatCard
          label="Study Focus Time"
          value={`${prod.totalStudyHours}h`}
          subtext="Logged deep focus hours"
          color="violet"
          icon={Clock}
        />

        <StatCard
          label="Career Readiness"
          value={`${career.careerReadinessScore}%`}
          subtext={`${career.criticalGapsCount} critical skill gaps`}
          color="emerald"
          icon={TrendingUp}
        />

        <StatCard
          label="Portfolio Projects"
          value={projects.totalProjects}
          subtext={`${projects.completedProjects} shipped & verified`}
          color="cyan"
          icon={FolderKanban}
        />
      </div>

      {/* 3. AI Smart Recommendations Widget */}
      <RecommendationsWidget />

      {/* 4. Weekly Productivity & Subject Velocity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Productivity & Task Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">
                Weekly Productivity Velocity
              </h3>
            </div>
            <Badge variant="blue" size="xs">
              Task Velocity
            </Badge>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#667085] dark:text-slate-400 mb-1">
                <span>Task Completion Progress</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{prod.completionRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${prod.completionRate}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">To Do</span>
                <span className="text-lg font-bold font-mono text-[#172033] dark:text-white">{prod.pendingTasks}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">In Flight</span>
                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  {prod.totalTasks - prod.completedTasks - prod.pendingTasks > 0 ? prod.totalTasks - prod.completedTasks - prod.pendingTasks : prod.pendingTasks}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Completed</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{prod.completedTasks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Focus Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-500" />
              <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">
                Subject Study Distribution
              </h3>
            </div>
            <Link to="/study" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              View Tracker →
            </Link>
          </div>

          {studyBySubject.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#667085] dark:text-slate-400 border border-dashed border-[#E7EAF0] dark:border-slate-800 rounded-2xl">
              No study hours logged yet. Start recording your sessions in Study Tracker!
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {studyBySubject.slice(0, 4).map((sub) => {
                const theme = getSubjectTheme(sub.subject);
                const maxHours = Math.max(...studyBySubject.map((s) => s.hours || 1), 1);
                const fillPct = Math.round(((sub.hours || 0) / maxHours) * 100);

                return (
                  <div key={sub.subject} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#172033] dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.hex }} />
                        {sub.subject}
                      </span>
                      <span className="font-mono text-[#667085] dark:text-slate-400">
                        {sub.hours}h ({sub.minutes}m)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${fillPct}%`, backgroundColor: theme.hex }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Activity: Upcoming Tasks & Recent Focus Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent / Upcoming Tasks */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">
              Recent Tasks & Action Items
            </h3>
            <Link to="/tasks" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              All Tasks →
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#667085] dark:text-slate-400 border border-dashed border-[#E7EAF0] dark:border-slate-800 rounded-2xl">
              No tasks created yet. Create a task to track your milestones!
            </div>
          ) : (
            <div className="divide-y divide-[#F1F4F9] dark:divide-slate-800">
              {recentTasks.slice(0, 4).map((task) => (
                <div key={task._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className={`font-semibold truncate ${task.status === "completed" ? "line-through text-slate-400" : "text-[#172033] dark:text-slate-200"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#667085] dark:text-slate-400">
                      {task.deadline && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={11} />
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={task.status === "completed" ? "emerald" : task.priority === "high" || task.priority === "urgent" ? "amber" : "blue"}
                    size="xs"
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Study Sessions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">
              Recent Deep Focus Logs
            </h3>
            <Link to="/study" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              Log Session →
            </Link>
          </div>

          {recentStudySessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#667085] dark:text-slate-400 border border-dashed border-[#E7EAF0] dark:border-slate-800 rounded-2xl">
              No recent study blocks recorded.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F4F9] dark:divide-slate-800">
              {recentStudySessions.slice(0, 4).map((sess) => {
                const theme = getSubjectTheme(sess.subject);
                return (
                  <div key={sess._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.hex }} />
                        <span className="font-semibold text-[#172033] dark:text-slate-200 truncate">
                          {sess.subject}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                        {new Date(sess.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400 text-xs px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40">
                      {sess.duration}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. AI Socratic Viva Callout Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-pink-50 via-purple-50 to-white dark:from-pink-950/30 dark:via-purple-950/20 dark:to-[#111827] border border-pink-200/70 dark:border-pink-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-800/50">
              Voice & Oral AI Simulator
            </span>
            <span className="text-xs text-[#667085] dark:text-slate-400">Oral Defense Examination</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white font-display">
            AI Socratic Viva Examiner
          </h3>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-300 max-w-xl leading-relaxed">
            Defend system design & CS choices orally via microphone. The examiner tests architectural depth, evaluates answers in real-time, and converts mistakes into actionable tasks.
          </p>
        </div>
        <Link to="/viva" className="shrink-0">
          <Button variant="primary" size="md" className="flex items-center gap-1.5 font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-500/25">
            <span>Enter Viva Room</span>
            <ArrowRight size={15} />
          </Button>
        </Link>
      </div>

      {/* 7. Quick Access Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/career"
          className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all group space-y-3 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
                <Target size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#172033] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Skill Gap Analysis
              </h3>
            </div>
            <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/40">
              {career.criticalGapsCount} Gaps
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
            Analyze benchmark proficiencies against required thresholds and master missing competencies.
          </p>
        </Link>

        <Link
          to="/projects"
          className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-cyan-200/60 dark:border-cyan-900/40 hover:border-cyan-400 shadow-sm hover:shadow-md transition-all group space-y-3 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 flex items-center justify-center">
                <FolderKanban size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#172033] dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                Projects Portfolio
              </h3>
            </div>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800/40">
              {projects.totalProjects} Builds
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
            Showcase fullstack builds, color-categorized tech stack badges, and GitHub demo deployments.
          </p>
        </Link>

        <Link
          to="/analytics"
          className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all group space-y-3 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center">
                <BarChart2 size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#172033] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Visual Analytics
              </h3>
            </div>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/40">
              Telemetry
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
            In-depth visual telemetry across task status distribution, subject focus hours, and competency growth.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
