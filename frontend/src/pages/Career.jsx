import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Sparkles,
  FileText,
  Check,
  TrendingUp,
  Search
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#191816] border border-[#2D2925] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E0693B] font-display">
              Career Intelligence Hub
            </span>
            <Badge variant="success" size="xs" dot>
              {connectedCount} Connected Platforms
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#FAF7F2] font-display">
            Career Intelligence & Multi-Platform Profile
          </h1>
          <p className="text-xs text-[#9C9384] max-w-xl leading-relaxed">
            Connect your professional and coding platforms to aggregate verified achievements, evaluate role readiness, and tailor verified resumes.
          </p>
        </div>

        {/* Target Career Selector & Action */}
        <div className="w-full md:w-auto min-w-[240px] space-y-2">
          <label className="text-[11px] font-semibold text-[#CDC5B6] uppercase tracking-wider block">
            Target Career Role
          </label>
          <select
            value={careerAnalysis?.targetRole || "Full Stack Developer"}
            onChange={(e) => handleTargetRoleChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-[#141312] border border-[#302C28] rounded-xl text-[#FAF7F2] focus:outline-none focus:border-[#E0693B] font-semibold cursor-pointer"
          >
            {careerCatalog.length === 0 ? (
              <option value={careerAnalysis?.targetRole || "Full Stack Developer"} className="bg-[#141312]">
                {careerAnalysis?.targetRole || "Full Stack Developer"}
              </option>
            ) : (
              careerCatalog.map((c) => (
                <option key={c._id || c.title} value={c.title} className="bg-[#141312]">
                  {c.title}
                </option>
              ))
            )}
          </select>

          <Link
            to="/resume"
            className="w-full py-2 px-3 rounded-xl bg-[#E0693B]/10 hover:bg-[#E0693B]/20 border border-[#E0693B]/30 text-[#E0693B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
          color="terracotta"
          icon={TrendingUp}
        />
        <StatCard
          label="Strong Skills"
          value={careerAnalysis?.acquiredSkillsCount || 0}
          subtext="At or above benchmark"
          color="sage"
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
          color="white"
          icon={Sparkles}
        />
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-[#2EA366]/10 border border-[#2EA366]/20 text-[#2EA366] text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast("")} className="text-[#2EA366] hover:opacity-75">✕</button>
        </div>
      )}

      {error && <ErrorMessage title="Career Intelligence Notice" message={error} onRetry={fetchData} />}

      {/* 2. Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2925] pb-2">
        <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Quick action to jump to Resume Builder */}
        <Link
          to="/resume"
          className="text-xs text-[#E0693B] hover:text-[#EB784B] font-semibold flex items-center gap-1 hover:underline"
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
              <h2 className="text-base font-bold text-[#FAF7F2] font-display">Connected Platforms</h2>
              <span className="text-xs text-[#787165]">
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
          <div className="p-6 sm:p-8 rounded-2xl bg-[#191816] border border-[#2D2925] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#FAF7F2] font-display">NEXORA Career Readiness Score</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#22201D] text-[#CDC5B6] border border-[#332F2A] rounded-full">
                  Formula Verified
                </span>
              </div>
              <p className="text-xs text-[#9C9384] leading-relaxed">
                Measures your acquired skill levels against required competency thresholds for target role{" "}
                <span className="text-[#E0693B] font-semibold">{careerAnalysis?.targetRole}</span>.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleRunAiSkillAnalysis} isLoading={isAnalyzing}>
                  ✨ Run AI Skill Analysis
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleOpenSkillModal()}>
                  + Add/Rate Skill
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-[#141312] border-4 border-[#E0693B]/30 shadow-inner">
                <span className="text-3xl font-extrabold font-mono text-[#E0693B]">{readinessScore}%</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-[#2EA366] font-semibold">{careerAnalysis?.acquiredSkillsCount || 0} Strong Skills</p>
                <p className="text-[#D97706] font-semibold">{skillGaps.filter((s) => s.category === "Improve").length} To Improve</p>
                <p className="text-rose-400 font-semibold">{careerAnalysis?.criticalGapsCount || 0} Critical Gaps</p>
              </div>
            </div>
          </div>

          {/* AI Skill Analysis Explanation Card */}
          {aiSkillAnalysis && (
            <div className="p-6 rounded-2xl bg-[#1E1C19] border border-[#E0693B]/25 space-y-3 animate-fade-in shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E0693B]" />
                <h3 className="text-sm font-bold text-[#E0693B] uppercase tracking-wider font-display">
                  AI Skill-Gap Explanation
                </h3>
              </div>
              <p className="text-xs text-[#FAF7F2] leading-relaxed whitespace-pre-wrap">{aiSkillAnalysis.aiExplanation}</p>
            </div>
          )}

          {/* Visual Skill Gap Competency Chart */}
          {chartData.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-[#FAF7F2] font-display">Skill Competency Comparison</h3>
                  <p className="text-xs text-[#9C9384]">Your current proficiency vs required target benchmark for {careerAnalysis?.targetRole}</p>
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
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2925" />
                    <XAxis
                      dataKey="name"
                      stroke="#9C9384"
                      fontSize={11}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#9C9384" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#191816",
                        borderColor: "#332F2A",
                        borderRadius: "12px",
                        color: "#FAF7F2",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="Current" fill="#E0693B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Required" fill="#645D54" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* AI Structured Career Roadmap View */}
          <AIRoadmapView initialRole={careerAnalysis?.targetRole || "Full Stack Developer"} />

          {/* Skill Gaps Breakdown Table */}
          <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#FAF7F2] font-display">Target Role Skill Gaps</h3>
                <p className="text-xs text-[#9C9384] mt-0.5">Formula: <code className="text-[#E0693B] font-mono">requiredLevel - currentLevel = gap</code></p>
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      skillFilter === f.id
                        ? "bg-[#E0693B]/10 text-[#E0693B] border-[#E0693B]/40"
                        : "bg-[#141312] text-[#9C9384] border-[#2D2925] hover:text-[#FAF7F2]"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#787165] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#141312] border border-[#2D2925] rounded-xl text-xs text-[#FAF7F2] placeholder-[#787165] focus:outline-none focus:border-[#E0693B]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141312] text-[#9C9384] border-b border-[#2D2925] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Skill</th>
                    <th className="p-3">Required Level</th>
                    <th className="p-3">Current Level</th>
                    <th className="p-3">Gap</th>
                    <th className="p-3">Status Category</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262420]">
                  {filteredSkillGaps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-[#787165]">
                        No skills match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSkillGaps.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#1E1C19] transition-colors">
                        <td className="p-3 font-semibold text-[#FAF7F2]">{item.skillName}</td>
                        <td className="p-3 font-mono text-[#9C9384]">{item.requiredLevel} / 100</td>
                        <td className="p-3 font-mono text-[#E0693B] font-semibold">{item.currentLevel} / 100</td>
                        <td className="p-3 font-mono text-rose-400 font-bold">{item.gap} pts</td>
                        <td className="p-3">
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
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenSkillModal(item.skillName, item.currentLevel)}
                            className="text-xs text-[#E0693B] hover:text-[#EB784B] font-medium underline"
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
            <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider block mb-1.5">Select Technical Skill</label>
            <select
              value={selectedSkillName}
              onChange={(e) => setSelectedSkillName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#141312] border border-[#302C28] rounded-xl text-[#FAF7F2] focus:outline-none focus:border-[#E0693B]"
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
              <label className="text-xs font-semibold text-[#CDC5B6] uppercase tracking-wider">Proficiency Level (0 - 100)</label>
              <span className="text-sm font-bold font-mono text-[#E0693B]">{currentLevelInput} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={currentLevelInput}
              onChange={(e) => setCurrentLevelInput(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#22201D] rounded-lg appearance-none cursor-pointer accent-[#E0693B]"
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
