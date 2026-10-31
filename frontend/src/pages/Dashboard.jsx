import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  FolderKanban,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import analyticsService from "../services/analytics.service";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Button from "../components/common/Button";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
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
      {/* Welcome Command Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#1C1A17] via-[#24211D] to-[#191816] border border-[#332F2A] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E0693B] font-display">
              Student Command Center
            </span>
            <Badge variant="primary" size="xs">
              Live Overview
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#FAF7F2] font-display">
            Welcome back, <span className="text-[#E0693B]">{user?.name || "Student"}</span> 👋
          </h1>
          <p className="text-xs text-[#9C9384] flex items-center gap-2">
            Targeting Role:{" "}
            <span className="text-[#CDC5B6] font-semibold bg-[#26231F] px-2.5 py-0.5 rounded-full border border-[#3A352F]">
              {career.targetRole}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/viva">
            <Button
              variant="primary"
              size="sm"
              className="bg-gradient-to-r from-[#C5572C] to-[#E0693B] flex items-center gap-1.5 shadow-md shadow-[#E0693B]/20"
            >
              <span>🎤 AI Socratic Viva</span>
            </Button>
          </Link>
          <Link to="/tasks?view=my_day">
            <Button variant="secondary" size="sm">
              Today's Tasks
            </Button>
          </Link>
          <Link to="/study">
            <Button variant="secondary" size="sm">
              + Log Study
            </Button>
          </Link>
          <Link to="/ai-coach">
            <Button variant="secondary" size="sm">
              AI Coach
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorMessage title="Dashboard Analytics Error" message={error} onRetry={fetchDashboardData} />}

      {/* AI Smart Recommendations Widget */}
      <RecommendationsWidget />

      {/* Live Metrics Grid — Powered by StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Productivity Score"
          value={`${prod.completionRate}%`}
          subtext={`${prod.completedTasks} of ${prod.totalTasks} tasks completed`}
          color="terracotta"
          icon={CheckCircle2}
        />

        <StatCard
          label="Study Duration"
          value={`${prod.totalStudyHours} hrs`}
          subtext="Focus hours logged"
          color="sage"
          icon={Clock}
        />

        <StatCard
          label="Career Readiness"
          value={`${career.careerReadinessScore}%`}
          subtext={`${career.criticalGapsCount} critical skill gaps`}
          color="amber"
          icon={TrendingUp}
        />

        <StatCard
          label="Portfolio Projects"
          value={projects.totalProjects}
          subtext={`${projects.completedProjects} completed projects`}
          color="white"
          icon={FolderKanban}
        />
      </div>

      {/* AI Socratic Viva Callout Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#201C18] via-[#28211B] to-[#1C1A17] border border-[#E0693B]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#E0693B]/20 text-[#E0693B] border border-[#E0693B]/30">
              Interactive Practice
            </span>
            <span className="text-xs text-[#9C9384]">Oral Defense Practice</span>
          </div>
          <h3 className="text-base font-bold text-[#FAF7F2] font-display">AI Socratic Viva Examiner</h3>
          <p className="text-xs text-[#9C9384] max-w-xl">
            Defend technical decisions orally via microphone or text. The examiner evaluates your depth, challenges edge cases, and converts weaknesses into study tasks.
          </p>
        </div>
        <Link to="/viva" className="shrink-0">
          <Button variant="primary" size="sm" className="bg-[#E0693B] shadow-md shadow-[#E0693B]/30 flex items-center gap-1.5 font-semibold">
            <span>Enter Viva Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Quick Access Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/career"
          className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] hover:border-[#E0693B]/50 transition-all group space-y-2 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E0693B]" />
              <h3 className="text-base font-semibold text-[#FAF7F2] group-hover:text-[#E0693B] transition-colors">
                Skill Gap Analysis
              </h3>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {career.criticalGapsCount} Critical
            </span>
          </div>
          <p className="text-xs text-[#9C9384] leading-relaxed">
            View required vs current skill levels and update your proficiency ratings.
          </p>
        </Link>

        <Link
          to="/projects"
          className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] hover:border-[#E0693B]/50 transition-all group space-y-2 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-semibold text-[#FAF7F2] group-hover:text-[#E0693B] transition-colors">
                Portfolio Projects
              </h3>
            </div>
            <span className="text-xs font-mono text-[#D97706] font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {projects.totalProjects} Total
            </span>
          </div>
          <p className="text-xs text-[#9C9384] leading-relaxed">
            Manage software projects, tech stack tags, and repository links.
          </p>
        </Link>

        <Link
          to="/analytics"
          className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] hover:border-[#E0693B]/50 transition-all group space-y-2 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2EA366]" />
              <h3 className="text-base font-semibold text-[#FAF7F2] group-hover:text-[#E0693B] transition-colors">
                Visual Analytics
              </h3>
            </div>
            <span className="text-xs font-mono text-[#2EA366] font-bold bg-[#2EA366]/10 px-2 py-0.5 rounded border border-[#2EA366]/20">
              Trends
            </span>
          </div>
          <p className="text-xs text-[#9C9384] leading-relaxed">
            View detailed trend charts for tasks, focus subjects, and career progress.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
