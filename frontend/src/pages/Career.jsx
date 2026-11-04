import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Sparkles,
  FileText,
  Check,
  TrendingUp,
  Search,
  Target,
  X
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useAuth } from "../context/AuthContext";
import careerService from "../services/career.service";
import skillService from "../services/skill.service";
import aiService from "../services/ai.service";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import TabNav from "../components/common/TabNav";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import AIRoadmapView from "../components/ai/AIRoadmapView";
import PlatformCard from "../components/career/PlatformCard";
import GitHubProjectSelector from "../components/career/GitHubProjectSelector";
import CodingStatsWidget from "../components/career/CodingStatsWidget";
import InferredSkillsWidget from "../components/career/InferredSkillsWidget";
import { RichMarkdownRenderer } from "../components/ai/RichMarkdownRenderer";

export const Career = () => {
  const { accessToken } = useAuth();

  // Active View Tab: "platforms" | "gaps"
  const [activeTab, setActiveTab] = useState("platforms");

  // Core Career Data
  const [careerCatalog, setCareerCatalog] = useState([]);
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [careerAnalysis, setCareerAnalysis] = useState(null);
  const [userSkills, setUserSkills] = useState([]);

  // Multi-Platform Connections State
  const [platforms, setPlatforms] = useState([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [isPlatformProcessing, setIsPlatformProcessing] = useState(false);
  const [isSyncingResume, setIsSyncingResume] = useState(false);

  // General Loading & Notification States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // AI Skill Analysis State
  const [aiSkillAnalysis, setAiSkillAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal State for setting skills
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [selectedSkillName, setSelectedSkillName] = useState("");
  const [currentLevelInput, setCurrentLevelInput] = useState(70);
  const [isSaving, setIsSaving] = useState(false);

  // Skill table filter and search
  const [skillFilter, setSkillFilter] = useState("all");
  const [skillSearch, setSkillSearch] = useState("");

  const showNotification = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  /**
   * Fetch all data: catalog, analysis, skills, and multi-platform connections
   */
  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const [careersRes, skillsRes, userCareerRes, userSkillsRes, platformsRes] = await Promise.all([
        careerService.getCareers().catch(() => ({ careers: [] })),
        skillService.getSkillCatalog().catch(() => ({ skills: [] })),
        careerService.getUserCareer(accessToken).catch(() => null),
        skillService.getUserSkills(accessToken).catch(() => ({ skills: [] })),
        careerService.getPlatforms(accessToken).catch(() => ({ platforms: [], connectedCount: 0 }))
      ]);

      setCareerCatalog(careersRes?.careers || []);
      setSkillCatalog(skillsRes?.skills || []);
      setCareerAnalysis(userCareerRes || null);
      setUserSkills(userSkillsRes?.skills || []);
      setPlatforms(platformsRes?.platforms || []);
      setConnectedCount(platformsRes?.connectedCount || 0);
    } catch (err) {
      setError(err.message || "Failed to load career intelligence data.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Target role change
  const handleTargetRoleChange = async (newRole) => {
    setIsLoading(true);
    try {
      const updated = await careerService.updateUserCareer(accessToken, { targetRole: newRole });
      setCareerAnalysis(updated);
      showNotification(`Target role updated to "${newRole}".`);
    } catch (err) {
      setError(err.message || "Failed to update target role.");
    } finally {
      setIsLoading(false);
    }
  };

  // AI Skill Gaps Analysis
  const handleRunAiSkillAnalysis = async () => {
    if (!accessToken || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await aiService.analyzeSkillGaps(accessToken);
      setAiSkillAnalysis(res);
      showNotification("AI skill analysis generated.");
    } catch (err) {
      setError(err.message || "Failed to generate AI Skill Analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Platform Actions: Connect / Refresh
  const handleConnectOrRefresh = async (platform, payload) => {
    if (!accessToken) return;
    setIsPlatformProcessing(true);
    setError("");
    try {
      const res = await careerService.connectPlatform(accessToken, platform, payload);
      if (res?.connection) {
        setPlatforms((prev) =>
          prev.map((p) => (p.platform === platform ? res.connection : p))
        );
        showNotification(res.message || `${platform.toUpperCase()} synchronized.`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || `Failed to connect ${platform}.`);
    } finally {
      setIsPlatformProcessing(false);
    }
  };

  // Platform Actions: Disconnect
  const handleDisconnect = async (platform) => {
    if (!accessToken) return;
    setIsPlatformProcessing(true);
    try {
      await careerService.disconnectPlatform(accessToken, platform);
      setPlatforms((prev) =>
        prev.map((p) =>
          p.platform === platform
            ? { ...p, connectionStatus: "disconnected", verificationStatus: "unverified", selectedItems: [] }
            : p
        )
      );
      showNotification(`${platform.toUpperCase()} disconnected.`);
    } catch (err) {
      setError(err.message || "Failed to disconnect platform.");
    } finally {
      setIsPlatformProcessing(false);
    }
  };

  // Save selected GitHub repos
  const handleSaveSelectedItems = async (platform, selectedItems) => {
    if (!accessToken) return;
    try {
      await careerService.updateSelectedItems(accessToken, platform, selectedItems);
      setPlatforms((prev) =>
        prev.map((p) => (p.platform === platform ? { ...p, selectedItems } : p))
      );
      showNotification("Selected projects updated for resume.");
    } catch (err) {
      setError(err.message || "Failed to save selected projects.");
    }
  };

  // Sync verified data to Resume Profile & Projects
  const handleSyncToResume = async () => {
    if (!accessToken) return;
    setIsSyncingResume(true);
    try {
      await careerService.syncProjectsToNexora(accessToken).catch(() => null);
      const res = await careerService.syncToResumeProfile(accessToken);
      showNotification(res.message || "Verified metrics & projects synchronized to your Resume Profile!");
    } catch (err) {
      setError(err.message || "Failed to sync to Resume Profile.");
    } finally {
      setIsSyncingResume(false);
    }
  };

  // Skill Modal
  const handleOpenSkillModal = (skillName = "", existingLevel = 70) => {
    setSelectedSkillName(skillName || (skillCatalog[0]?.name || ""));
    setCurrentLevelInput(existingLevel);
    setIsSkillModalOpen(true);
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillName) return;

    setIsSaving(true);
    setError("");

    try {
      await skillService.addUserSkill(accessToken, {
        skillName: selectedSkillName,
        currentLevel: currentLevelInput
      });
      setIsSkillModalOpen(false);
      fetchData();
      showNotification(`Skill rating for ${selectedSkillName} saved.`);
    } catch (err) {
      setError(err.message || "Failed to update skill rating.");
    } finally {
      setIsSaving(false);
    }
  };

  const readinessScore = Math.max(0, Number(careerAnalysis?.careerReadinessScore) || 0);
  const skillGaps = Array.isArray(careerAnalysis?.skillGaps) ? careerAnalysis.skillGaps : [];
  const safePlatforms = Array.isArray(platforms) ? platforms : [];
  const githubConn = safePlatforms.find((p) => p && p.platform === "github");
  const leetcodeConn = safePlatforms.find((p) => p && p.platform === "leetcode");
  const codeforcesConn = safePlatforms.find((p) => p && p.platform === "codeforces");

  const chartData = useMemo(() => {
    return (skillGaps || [])
      .filter((s) => s && s.skillName)
      .map((s) => ({
        name: s.skillName,
        Current: Math.max(0, Number(s.currentLevel) || 0),
        Required: Math.max(0, Number(s.requiredLevel) || 0)
      }));
  }, [skillGaps]);

  const filteredSkillGaps = useMemo(() => {
    return (skillGaps || []).filter((item) => {
      if (!item || !item.skillName) return false;
      const matchesCategory = skillFilter === "all" || item.category === skillFilter;
      const matchesSearch =
        !skillSearch.trim() ||
        String(item.skillName).toLowerCase().includes(skillSearch.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [skillGaps, skillFilter, skillSearch]);

  const tabs = [
    {
      id: "platforms",
      label: "Platform Intelligence & Portfolio",
      icon: Layers,
      badge: connectedCount
    },
    {
      id: "gaps",
      label: "Skill Gaps & AI Roadmap",
      icon: TrendingUp,
      badge: skillGaps.length
    }
  ];

  if (isLoading && !careerAnalysis) {
    return <Loader text="Loading Career Intelligence & Platform Ecosystem..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7EAF0] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F7CFF] font-sans flex items-center gap-1">
              <Target size={13} /> Career Intelligence Hub
            </span>
            <Badge variant="success" size="xs" dot>
              {connectedCount} Connected Platforms
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] font-display tracking-tight">
            Career Intelligence & Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] max-w-xl leading-relaxed">
            Connect your professional and coding platforms to aggregate verified achievements, evaluate role readiness, and tailor verified resumes.
          </p>
        </div>

        {/* Target Career Selector & Action */}
        <div className="w-full md:w-auto min-w-[240px] space-y-2">
          <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
            Target Career Role
          </label>
          <select
            value={careerAnalysis?.targetRole || "Full Stack Developer"}
            onChange={(e) => handleTargetRoleChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 font-semibold cursor-pointer shadow-xs transition-all"
          >
            {careerCatalog.length === 0 ? (
              <option value={careerAnalysis?.targetRole || "Full Stack Developer"}>
                {careerAnalysis?.targetRole || "Full Stack Developer"}
              </option>
            ) : (
              careerCatalog.map((c) => (
                <option key={c._id || c.title} value={c.title}>
                  {c.title}
                </option>
              ))
            )}
          </select>

          <Link
            to="/resume"
            className="w-full py-2 px-3 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#4F7CFF]/30 text-[#4F7CFF] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tailor Resume for Role</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Readiness Score"
          value={`${readinessScore}%`}
          subtext={`Target: ${careerAnalysis?.targetRole || "Role"}`}
          color="emerald"
          icon={TrendingUp}
        />
        <StatCard
          label="Strong Skills"
          value={careerAnalysis?.acquiredSkillsCount || 0}
          subtext="At or above benchmark"
          color="cyan"
          icon={Check}
        />
        <StatCard
          label="To Improve"
          value={skillGaps.filter((s) => s.category === "Improve").length}
          subtext="Within 20pts of goal"
          color="amber"
          icon={TrendingUp}
        />
        <StatCard
          label="Critical Gaps"
          value={careerAnalysis?.criticalGapsCount || 0}
          subtext="Priority learning focus"
          color="rose"
          icon={Sparkles}
        />
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast("")}
            className="text-[#027A48] hover:opacity-75 cursor-pointer font-bold p-1 rounded-lg hover:bg-[#D1FADF]/60 transition-colors flex items-center justify-center"
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && <ErrorMessage title="Career Intelligence Notice" message={error} onRetry={fetchData} />}

      {/* 2. Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF0] pb-2">
        <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Quick action to jump to Resume Builder */}
        <Link
          to="/resume"
          className="text-xs text-[#4F7CFF] hover:text-[#3E6AE1] font-semibold flex items-center gap-1 hover:underline"
        >
          <FileText className="w-3.5 h-3.5" /> Open Resume Builder →
        </Link>
      </div>

      {/* 3. TAB 1: PLATFORM INTELLIGENCE & PORTFOLIO */}
      {activeTab === "platforms" && (
        <div className="space-y-8">
          {/* Platform Connection Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#172033] font-display">Connected Platforms</h2>
              <span className="text-xs text-[#667085]">
                {connectedCount} of {platforms.length} connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {platforms.map((conn) => (
                <PlatformCard
                  key={conn.platform}
                  platformKey={conn.platform}
                  connection={conn}
                  onConnect={handleConnectOrRefresh}
                  onRefresh={handleConnectOrRefresh}
                  onDisconnect={handleDisconnect}
                  isProcessing={isPlatformProcessing}
                />
              ))}
            </div>
          </div>

          {/* Coding & Contest Stats Widget */}
          <CodingStatsWidget
            leetcodeConnection={leetcodeConn}
            codeforcesConnection={codeforcesConn}
          />

          {/* Selected GitHub Projects Showcase */}
          <GitHubProjectSelector
            githubConnection={githubConn}
            onSaveSelected={handleSaveSelectedItems}
            onSyncToResume={handleSyncToResume}
            isSyncing={isSyncingResume}
          />

          {/* AI-Inferred Technical Skills Widget */}
          <InferredSkillsWidget
            platforms={platforms}
            userSkills={userSkills}
            onAddSkill={(skillName) => handleOpenSkillModal(skillName, 75)}
          />
        </div>
      )}

      {/* 4. TAB 2: SKILL GAPS & AI ROADMAP */}
      {activeTab === "gaps" && (
        <div className="space-y-8">
          {/* NEXORA Career Readiness Score Meter */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#172033] dark:text-white font-display">Career Readiness Score</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-full font-mono">
                  Formula Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
                Measures your acquired skill levels against required competency thresholds for target role{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{careerAnalysis?.targetRole}</span>.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunAiSkillAnalysis}
                  isLoading={isAnalyzing}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Run AI Skill Analysis</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleOpenSkillModal()}>
                  + Add/Rate Skill
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-4 border-emerald-500/30 shadow-inner">
                <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{readinessScore}%</span>
              </div>
              <div className="space-y-1.5 text-xs font-medium">
                <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {careerAnalysis?.acquiredSkillsCount || 0} Strong Skills
                </p>
                <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {skillGaps.filter((s) => s.category === "Improve").length} To Improve
                </p>
                <p className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {careerAnalysis?.criticalGapsCount || 0} Critical Gaps
                </p>
              </div>
            </div>
          </div>

          {/* AI Skill Analysis Explanation Card */}
          {aiSkillAnalysis && (
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-50/80 via-white to-white dark:from-emerald-950/20 dark:via-[#111827] dark:to-[#111827] border border-emerald-300/80 dark:border-emerald-800/40 space-y-4 animate-fade-in shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 dark:border-emerald-800/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 font-display">
                      AI Skill-Gap Intelligence & Pedagogical Roadmap
                    </h3>
                    <p className="text-[11px] text-[#667085] dark:text-slate-400">
                      Formula-verified breakdown, interactive skill charts, and structured action plan
                    </p>
                  </div>
                </div>
                <Badge variant="emerald" size="xs">
                  AI Verified
                </Badge>
              </div>
              <div className="text-xs sm:text-sm text-[#172033] dark:text-slate-200 leading-relaxed">
                <RichMarkdownRenderer content={aiSkillAnalysis.aiExplanation} />
              </div>
            </div>
          )}

          {/* Visual Skill Gap Competency Chart */}
          {chartData.length > 0 && (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#172033] dark:text-white font-display">Skill Competency Comparison</h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">Your current proficiency vs required target benchmark for {careerAnalysis?.targetRole}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500" /> Current Level
                  </span>
                  <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded bg-violet-500" /> Required Benchmark
                  </span>
                </div>
              </div>
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      stroke="#667085"
                      fontSize={11}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#667085" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        borderColor: "#1F2937",
                        borderRadius: "12px",
                        color: "#F8FAFC",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)"
                      }}
                    />
                    <Bar dataKey="Current" fill="#06B6D4" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={800} />
                    <Bar dataKey="Required" fill="#8B5CF6" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* AI Structured Career Roadmap View */}
          <AIRoadmapView initialRole={careerAnalysis?.targetRole || "Full Stack Developer"} />

          {/* Skill Gaps Breakdown Table */}
          <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#172033] font-display">Target Role Skill Gaps</h3>
                <p className="text-xs text-[#667085] mt-0.5">Formula: <code className="text-[#4F7CFF] font-mono bg-[#EEF2FF] px-1.5 py-0.5 rounded">requiredLevel - currentLevel = gap</code></p>
              </div>
              <Button variant="primary" size="sm" onClick={() => handleOpenSkillModal()}>
                + Update Skill Level
              </Button>
            </div>

            {/* Filter Chips & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: "All Skills", count: skillGaps.length },
                  { id: "Critical", label: "Critical", count: skillGaps.filter((s) => s.category === "Critical").length },
                  { id: "Improve", label: "To Improve", count: skillGaps.filter((s) => s.category === "Improve").length },
                  { id: "Strong", label: "Strong", count: skillGaps.filter((s) => s.category === "Strong").length }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSkillFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                      skillFilter === f.id
                        ? "bg-[#EEF2FF] text-[#4F7CFF] border-[#4F7CFF]/30 shadow-xs"
                        : "bg-white text-[#667085] border-[#E7EAF0] hover:text-[#172033] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E7EAF0] rounded-xl text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 shadow-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E7EAF0]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#667085] border-b border-[#E7EAF0] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Skill</th>
                    <th className="p-3.5">Required Level</th>
                    <th className="p-3.5">Current Level</th>
                    <th className="p-3.5">Gap</th>
                    <th className="p-3.5">Status Category</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF0] bg-white">
                  {filteredSkillGaps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-[#98A2B3]">
                        No skills match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSkillGaps.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-3.5 font-semibold text-[#172033]">{item.skillName}</td>
                        <td className="p-3.5 font-mono text-[#667085]">{item.requiredLevel} / 100</td>
                        <td className="p-3.5 font-mono text-[#4F7CFF] font-semibold">{item.currentLevel} / 100</td>
                        <td className="p-3.5 font-mono text-[#F04438] font-bold">{item.gap} pts</td>
                        <td className="p-3.5">
                          <Badge
                            variant={
                              item.category === "Critical"
                                ? "danger"
                                : item.category === "Improve"
                                ? "warning"
                                : "success"
                            }
                            size="xs"
                          >
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenSkillModal(item.skillName, item.currentLevel)}
                            className="text-xs text-[#4F7CFF] hover:text-[#3E6AE1] font-semibold hover:underline cursor-pointer"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Skill Update Modal */}
      <Modal isOpen={isSkillModalOpen} onClose={() => setIsSkillModalOpen(false)} title="Update Technical Skill Level">
        <form onSubmit={handleSaveSkill} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#172033] uppercase tracking-wider block mb-1.5">
              Select Technical Skill
            </label>
            <select
              value={selectedSkillName}
              onChange={(e) => setSelectedSkillName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E7EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
            >
              {skillCatalog.length === 0 ? (
                <option value={selectedSkillName || "JavaScript"}>
                  {selectedSkillName || "JavaScript"}
                </option>
              ) : (
                skillCatalog.map((s) => (
                  <option key={s._id || s.name} value={s.name}>
                    {s.name} ({s.category || "General"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
                Proficiency Level (0 - 100)
              </label>
              <span className="text-sm font-bold font-mono text-[#4F7CFF]">{currentLevelInput} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={currentLevelInput}
              onChange={(e) => setCurrentLevelInput(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#E7EAF0] rounded-lg appearance-none cursor-pointer accent-[#4F7CFF]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsSkillModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Save Skill Rating
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Career;
