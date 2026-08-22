import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import careerService from "../services/career.service";
import skillService from "../services/skill.service";
import aiService from "../services/ai.service";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import AIRoadmapView from "../components/ai/AIRoadmapView";

export const Career = () => {
  const { accessToken } = useAuth();

  const [careerCatalog, setCareerCatalog] = useState([]);
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [careerAnalysis, setCareerAnalysis] = useState(null);
  const [userSkills, setUserSkills] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Skill Analysis State
  const [aiSkillAnalysis, setAiSkillAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal State for setting skills
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [selectedSkillName, setSelectedSkillName] = useState("");
  const [currentLevelInput, setCurrentLevelInput] = useState(70);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");

    try {
      const [careersRes, skillsRes, userCareerRes, userSkillsRes] = await Promise.all([
        careerService.getCareers(),
        skillService.getSkillCatalog(),
        careerService.getUserCareer(accessToken),
        skillService.getUserSkills(accessToken)
      ]);

      setCareerCatalog(careersRes.careers || []);
      setSkillCatalog(skillsRes.skills || []);
      setCareerAnalysis(userCareerRes);
      setUserSkills(userSkillsRes.skills || []);
    } catch (err) {
      setError(err.message || "Failed to load career intelligence data.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTargetRoleChange = async (newRole) => {
    setIsLoading(true);
    try {
      const updated = await careerService.updateUserCareer(accessToken, { targetRole: newRole });
      setCareerAnalysis(updated);
    } catch (err) {
      setError(err.message || "Failed to update target role.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAiSkillAnalysis = async () => {
    if (!accessToken || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await aiService.analyzeSkillGaps(accessToken);
      setAiSkillAnalysis(res);
    } catch (err) {
      setError(err.message || "Failed to generate AI Skill Analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    } catch (err) {
      setError(err.message || "Failed to update skill rating.");
    } finally {
      setIsSaving(false);
    }
  };

  const categoryBadges = {
    Strong: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    Improve: "bg-amber-950/80 text-amber-300 border-amber-800",
    Critical: "bg-rose-950/80 text-rose-300 border-rose-800"
  };

  if (isLoading && !careerAnalysis) {
    return <Loader text="Analyzing career requirements & skill gaps..." />;
  }

  const readinessScore = careerAnalysis?.careerReadinessScore || 0;
  const skillGaps = careerAnalysis?.skillGaps || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Phase 7 AI Intelligence</span>
          <h1 className="text-2xl font-bold text-slate-100">Career Intelligence & Skill-Gap Analysis</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Select your target career role, analyze skill gaps with backend metrics, and generate AI-reasoned explanations & roadmaps.
          </p>
        </div>

        {/* Target Career Selector */}
        <div className="w-full md:w-auto min-w-[220px]">
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Target Career Role</label>
          <select
            value={careerAnalysis?.targetRole || "Full Stack Developer"}
            onChange={(e) => handleTargetRoleChange(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-indigo-500/50 rounded-xl text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
          >
            {careerCatalog.map((c) => (
              <option key={c._id || c.title} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorMessage title="Career Intelligence Error" message={error} onRetry={fetchData} />}

      {/* NEXORA Career Readiness Score Meter & AI Analysis Action */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">NEXORA Career Readiness Score</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full">
              Formula Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Measures your acquired skill levels against required competency thresholds for target role{" "}
            <span className="text-indigo-300 font-semibold">{careerAnalysis?.targetRole}</span>.
          </p>

          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={handleRunAiSkillAnalysis} isLoading={isAnalyzing}>
              ✨ Run AI Skill Analysis
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-slate-950 border-4 border-indigo-500/30">
            <span className="text-3xl font-extrabold font-mono text-indigo-400">{readinessScore}%</span>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-emerald-400 font-semibold">{careerAnalysis?.acquiredSkillsCount || 0} Strong Skills</p>
            <p className="text-amber-400 font-semibold">{skillGaps.filter((s) => s.category === "Improve").length} To Improve</p>
            <p className="text-rose-400 font-semibold">{careerAnalysis?.criticalGapsCount || 0} Critical Gaps</p>
          </div>
        </div>
      </div>

      {/* AI Skill Analysis Explanation Card */}
      {aiSkillAnalysis && (
        <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">AI Skill-Gap Explanation</h3>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{aiSkillAnalysis.aiExplanation}</p>
        </div>
      )}

      {/* Phase 7 AI Structured Career Roadmap View */}
      <AIRoadmapView initialRole={careerAnalysis?.targetRole || "Full Stack Developer"} />

      {/* Skill Gaps Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Target Role Skill Gaps</h3>
            <p className="text-xs text-slate-400">Formula: <code className="text-indigo-300">requiredLevel - currentLevel = gap</code></p>
          </div>
          <Button variant="primary" size="sm" onClick={() => handleOpenSkillModal()}>
            + Update Skill Level
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Skill</th>
                <th className="p-3">Required Level</th>
                <th className="p-3">Current Level</th>
                <th className="p-3">Gap</th>
                <th className="p-3">Status Category</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {skillGaps.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-200">{item.skillName}</td>
                  <td className="p-3 font-mono text-slate-400">{item.requiredLevel} / 100</td>
                  <td className="p-3 font-mono text-indigo-300 font-semibold">{item.currentLevel} / 100</td>
                  <td className="p-3 font-mono text-rose-400 font-bold">{item.gap} pts</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${categoryBadges[item.category]}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenSkillModal(item.skillName, item.currentLevel)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Saved Skills Inventory */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-semibold text-slate-100">Your Rated Skill Inventory ({userSkills.length})</h3>
        {userSkills.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No skills rated yet. Click "+ Update Skill Level" to set your ratings.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {userSkills.map((s) => (
              <div key={s._id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{s.skillName}</p>
                  <p className="text-[10px] text-indigo-400 font-mono">Proficiency: {s.currentLevel} / 100</p>
                </div>
                <button
                  onClick={() => handleOpenSkillModal(s.skillName, s.currentLevel)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Update Modal */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title="Update Skill Rating (0–100)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSkillModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSkill} isLoading={isSaving}>
              Save Skill Rating
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSkill} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Select Skill</label>
            <select
              value={selectedSkillName}
              onChange={(e) => setSelectedSkillName(e.target.value)}
              className="px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {skillCatalog.map((s) => (
                <option key={s._id || s.name} value={s.name}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-300">Current Skill Level Rating</label>
              <span className="font-mono text-indigo-400 font-bold text-sm">{currentLevelInput} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={currentLevelInput}
              onChange={(e) => setCurrentLevelInput(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 (Beginner)</span>
              <span>50 (Intermediate)</span>
              <span>100 (Expert)</span>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Career;
