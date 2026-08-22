import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import resumeService from "../services/resume.service";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const ResumeBuilder = () => {
  const { accessToken } = useAuth();

  const [resumeData, setResumeData] = useState(null);
  const [markdownExport, setMarkdownExport] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const fetchResume = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");

    try {
      const [dataRes, mdRes] = await Promise.all([
        resumeService.getResume(accessToken),
        resumeService.exportResume(accessToken, "markdown")
      ]);

      setResumeData(dataRes.resume);
      setMarkdownExport(mdRes.export || "");
    } catch (err) {
      setError(err.message || "Failed to synthesize student resume data.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const handleAiEnhanceSummary = async () => {
    if (!accessToken || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await resumeService.generateAiSummary(accessToken);
      if (res && res.summary) {
        setResumeData((prev) => ({ ...prev, summary: res.summary }));
      }
    } catch (err) {
      setError(err.message || "Failed to enhance summary with AI.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!markdownExport) return;
    navigator.clipboard.writeText(markdownExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!markdownExport) return;
    const blob = new Blob([markdownExport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData?.personalInfo?.name || "Student"}_Resume.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!resumeData) return;
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData?.personalInfo?.name || "Student"}_Resume.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <Loader text="Synthesizing verified student resume & portfolio..." />;
  }

  const pInfo = resumeData?.personalInfo || {};
  const skills = resumeData?.skills || {};
  const projects = resumeData?.projects || [];
  const achievements = resumeData?.achievements || [];
  const academics = resumeData?.academics || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner & Export Toolbar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Substep 12C Intelligence Engine</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Data Grounded
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Student Resume & Portfolio Showcase</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Automatically synthesizes your verified NEXORA skill ratings, completed portfolio projects, milestone tasks, and career readiness score into an exportable resume.
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleCopyMarkdown}>
            {copied ? "Copied ✓" : "Copy Markdown"}
          </Button>

          <Button variant="secondary" size="sm" onClick={handleDownloadMarkdown}>
            Download .md
          </Button>

          <Button variant="secondary" size="sm" onClick={handleDownloadJson}>
            Download .json
          </Button>

          <Button variant="primary" size="sm" onClick={handleAiEnhanceSummary} isLoading={isEnhancing}>
            ✨ AI Enhance Summary
          </Button>
        </div>
      </div>

      {error && <ErrorMessage title="Resume Engine Error" message={error} onRetry={fetchResume} />}

      {/* Main Resume Paper View */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-8 shadow-2xl">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-100 uppercase tracking-wide">{pInfo.name}</h2>
            <p className="text-sm font-bold text-indigo-400 font-mono">
              Target Role: {resumeData?.targetRole}
            </p>
            <p className="text-xs text-slate-400">Email: {pInfo.email}</p>
            {pInfo.education?.institution && (
              <p className="text-xs text-slate-400">
                Education: <span className="text-slate-200">{pInfo.education.degree || "Degree"}</span> — {pInfo.education.institution} ({pInfo.education.year || "Present"})
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Career Readiness</span>
            <p className="text-3xl font-extrabold text-indigo-400 font-mono">{resumeData?.careerReadinessScore || 0}%</p>
          </div>
        </div>

        {/* Professional Summary Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">1. Professional Summary</h3>
          <p className="text-xs text-slate-300 leading-relaxed p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {resumeData?.summary}
          </p>
        </div>

        {/* Technical Skill Inventory Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">2. Verified Technical Skill Inventory</h3>
          <div className="space-y-2">
            {skills.expert?.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <span className="font-semibold text-emerald-400 w-32 shrink-0">Expert (&ge; 80/100):</span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.expert.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skills.proficient?.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <span className="font-semibold text-indigo-400 w-32 shrink-0">Proficient (&ge; 50/100):</span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.proficient.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skills.developing?.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <span className="font-semibold text-amber-400 w-32 shrink-0">Developing (&lt; 50/100):</span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.developing.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skills.allRated?.length === 0 && (
              <p className="text-xs text-slate-500">No rated technical skills recorded yet.</p>
            )}
          </div>
        </div>

        {/* Portfolio Projects Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">3. Portfolio Projects Showcase ({projects.length})</h3>
          {projects.length === 0 ? (
            <p className="text-xs text-slate-500">No portfolio projects added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100">{p.title}</h4>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {p.status}
                    </span>
                  </div>
                  {p.description && <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>}

                  {p.techStack?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.techStack.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 text-[11px]">
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-medium">
                        GitHub Repo →
                      </a>
                    )}
                    {p.demoUrl && (
                      <a href={p.demoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 underline font-medium">
                        Live Demo →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestone Achievements Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">4. Milestone Achievements ({achievements.length})</h3>
          {achievements.length === 0 ? (
            <p className="text-xs text-slate-500">No completed roadmap tasks recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {achievements.map((a, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-start gap-2 text-xs">
                  <span className="text-emerald-400 font-bold">•</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-200">
                      {a.title} {a.roadmapStage && <span className="text-[10px] font-mono text-indigo-400 font-normal">({a.roadmapStage})</span>}
                    </p>
                    {a.description && <p className="text-[11px] text-slate-400">{a.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Academic Engagement & Study Velocity Section */}
        <div className="space-y-2 border-t border-slate-800 pt-6">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">5. Academic Engagement & Learning Velocity</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-500 font-medium">Total Study Hours</span>
              <p className="text-lg font-bold font-mono text-slate-100">{academics.totalStudyHours} hrs</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-500 font-medium">Study Sessions</span>
              <p className="text-lg font-bold font-mono text-indigo-400">{academics.totalStudySessions}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-500 font-medium">Benchmark Skills Acquired</span>
              <p className="text-lg font-bold font-mono text-emerald-400">{academics.acquiredSkillsCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
