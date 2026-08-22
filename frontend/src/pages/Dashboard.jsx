import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import analyticsService from "../services/analytics.service";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Button from "../components/common/Button";
import RecommendationsWidget from "../components/ai/RecommendationsWidget";

export const Dashboard = () => {
  const { user, accessToken } = useAuth();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await analyticsService.getDashboardAnalytics(accessToken);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard analytics overview.");
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

  const prod = data?.productivity || { totalTasks: 0, completedTasks: 0, pendingTasks: 0, completionRate: 0, totalStudyHours: 0 };
  const career = data?.career || { targetRole: "Full Stack Developer", careerReadinessScore: 0, criticalGapsCount: 0, acquiredSkillsCount: 0 };
  const projects = data?.projects || { totalProjects: 0, completedProjects: 0 };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Welcome back, <span className="text-indigo-400">{user?.name || "Student"}</span> 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Targeting: <span className="text-indigo-300 font-semibold">{career.targetRole}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/tasks">
            <Button variant="primary" size="sm">
              + Tasks
            </Button>
          </Link>
          <Link to="/study">
            <Button variant="secondary" size="sm">
              + Log Study
            </Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline" size="sm">
              + Projects
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorMessage title="Dashboard Analytics Error" message={error} onRetry={fetchDashboardData} />}

      {/* Phase 7 AI Smart Recommendations Widget */}
      <RecommendationsWidget />

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Productivity Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Productivity Score</span>
          <p className="text-3xl font-extrabold text-indigo-400 font-mono">{prod.completionRate}%</p>
          <p className="text-[11px] text-slate-500">{prod.completedTasks} of {prod.totalTasks} tasks completed</p>
        </div>

        {/* Study Hours Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Study Duration</span>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{prod.totalStudyHours} hrs</p>
          <p className="text-[11px] text-slate-500">Focus hours logged</p>
        </div>

        {/* NEXORA Career Readiness Score Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Career Readiness</span>
          <p className="text-3xl font-extrabold text-cyan-400 font-mono">{career.careerReadinessScore}%</p>
          <p className="text-[11px] text-slate-500">{career.criticalGapsCount} critical skill gaps remaining</p>
        </div>

        {/* Projects Portfolio Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Portfolio Projects</span>
          <p className="text-3xl font-extrabold text-purple-400 font-mono">{projects.totalProjects}</p>
          <p className="text-[11px] text-slate-500">{projects.completedProjects} completed projects</p>
        </div>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/career"
          className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300">Skill Gap Analysis ➔</h3>
            <span className="text-xs font-mono text-rose-400 font-bold">{career.criticalGapsCount} Critical</span>
          </div>
          <p className="text-xs text-slate-400">
            View required vs current skill levels and update your proficiency ratings.
          </p>
        </Link>

        <Link
          to="/projects"
          className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300">Portfolio Projects ➔</h3>
            <span className="text-xs font-mono text-purple-400 font-bold">{projects.totalProjects} Total</span>
          </div>
          <p className="text-xs text-slate-400">
            Manage software projects, tech stack tags, and repository links.
          </p>
        </Link>

        <Link
          to="/analytics"
          className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300">Visual Analytics ➔</h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">Recharts</span>
          </div>
          <p className="text-xs text-slate-400">
            View detailed trend charts for tasks, focus subjects, and career progress.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
