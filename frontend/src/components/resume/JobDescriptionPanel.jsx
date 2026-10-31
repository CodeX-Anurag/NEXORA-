import React, { useState } from "react";
import {
  Briefcase,
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Link2,
  Edit2
} from "lucide-react";
import Button from "../common/Button";
import resumeService from "../../services/resume.service";

export const JobDescriptionPanel = ({
  accessToken,
  profile,
  onTailorResume,
  isTailoring = false,
  initialJob = null
}) => {
  const [jobMode, setJobMode] = useState("paste"); // "paste" | "url"
  const [pastedText, setPastedText] = useState(initialJob?.rawText || "");
  const [jobUrl, setJobUrl] = useState(initialJob?.sourceUrl || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [fallbackWarning, setFallbackWarning] = useState("");

  const [analyzedJob, setAnalyzedJob] = useState(initialJob?.parsed || null);
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);

  const handleAnalyze = async () => {
    if (!accessToken) return;
    setError("");
    setFallbackWarning("");
    setIsAnalyzing(true);

    try {
      const payload = jobMode === "url" ? { jobUrl } : { jobText: pastedText };
      const res = await resumeService.analyzeJobDescription(accessToken, payload);

      if (res?.success && res.jobAnalysis?.parsed) {
        const parsed = res.jobAnalysis.parsed;
        setAnalyzedJob(parsed);

        // Run match comparison with current confirmed profile
        if (profile) {
          const matchRes = await resumeService.getJobMatchFeedback(accessToken, {
            profileData: profile,
            jobData: parsed
          });
          if (matchRes?.success) {
            setMatchAnalysis(matchRes.matchAnalysis);
          }
        }
      } else {
        throw new Error("Unable to analyze job description.");
      }
    } catch (err) {
      if (err.data?.fallbackRequired) {
        setFallbackWarning(err.message);
        setJobMode("paste");
      } else {
        setError(err.message || "Failed to analyze job description.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunTailor = () => {
    if (!analyzedJob || !onTailorResume) return;
    onTailorResume({
      targetRole: analyzedJob.jobTitle,
      targetCompany: analyzedJob.company,
      jobDescription: analyzedJob
    });
  };

  return (
    <div className="space-y-6">
      {/* Search / Input Box */}
      <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#E0693B]" />
              <h3 className="text-base font-bold text-[#FAF7F2] font-display">Target Job Intelligence</h3>
            </div>
            <p className="text-xs text-[#9C9384] mt-1">
              Analyze a job description or public posting URL to tailor your resume and evaluate skill alignment.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#141312] p-1 rounded-xl border border-[#2D2925] text-xs">
            <button
              type="button"
              onClick={() => setJobMode("paste")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                jobMode === "paste" ? "bg-[#25221F] text-[#FAF7F2]" : "text-[#9C9384] hover:text-[#FAF7F2]"
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setJobMode("url")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                jobMode === "url" ? "bg-[#25221F] text-[#FAF7F2]" : "text-[#9C9384] hover:text-[#FAF7F2]"
              }`}
            >
              <Globe className="w-3 h-3" /> Job URL
            </button>
          </div>
        </div>

        {fallbackWarning && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{fallbackWarning}</p>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                We have switched you to text mode. Simply copy the job text from the browser and paste it below.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Inputs */}
        {jobMode === "url" ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 absolute left-3 top-3 text-[#787165]" />
                <input
                  type="url"
                  placeholder="https://example.com/careers/software-engineer"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="w-full bg-[#141312] border border-[#2D2925] rounded-xl pl-9 pr-3 py-2 text-xs text-[#FAF7F2] focus:outline-none focus:border-[#E0693B]"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAnalyze}
                disabled={!jobUrl || isAnalyzing}
                isLoading={isAnalyzing}
                className="shrink-0"
              >
                <Search className="w-3.5 h-3.5 mr-1" /> Analyze URL
              </Button>
            </div>
            <p className="text-[11px] text-[#787165]">
              Respects access terms & robots restrictions. If a site uses Cloudflare, login walls, or captchas, paste the description text directly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={5}
              placeholder="Paste the full job description here (title, requirements, tech stack, responsibilities)..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full bg-[#141312] border border-[#2D2925] rounded-xl p-3 text-xs text-[#FAF7F2] focus:outline-none focus:border-[#E0693B] leading-relaxed"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAnalyze}
                disabled={pastedText.length < 30 || isAnalyzing}
                isLoading={isAnalyzing}
              >
                <Search className="w-3.5 h-3.5 mr-1" /> Analyze Requirements
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results & Match Breakdown */}
      {analyzedJob && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Extracted Requirements */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2D2925] pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase text-[#E0693B] font-bold">Extracted Target Role</span>
                  {analyzedJob.isStructured !== undefined && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      analyzedJob.isStructured
                        ? "bg-[#2EA366]/10 text-[#2EA366] border border-[#2EA366]/30"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                    }`}>
                      {analyzedJob.isStructured ? "Structured JSON-LD" : "Semantic HTML"}
                    </span>
                  )}
                  {analyzedJob.jobType && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E1C19] text-[#CDC5B6] border border-[#2D2925]">
                      {analyzedJob.jobType}
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-[#FAF7F2] font-display">{analyzedJob.jobTitle}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#9C9384] mt-1">
                  <span>{analyzedJob.company}</span>
                  <span>•</span>
                  <span>{analyzedJob.location || "Remote / Onsite"}</span>
                  {analyzedJob.experienceRequirements && (
                    <>
                      <span>•</span>
                      <span className="text-[#CDC5B6] font-mono">{analyzedJob.experienceRequirements}</span>
                    </>
                  )}
                  {analyzedJob.applicationUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={analyzedJob.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E0693B] hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Globe className="w-3 h-3" /> Job Link
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingRequirements(!isEditingRequirements)}
                  className="text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> {isEditingRequirements ? "Done" : "Edit"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunTailor}
                  isLoading={isTailoring}
                  className="text-xs flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Tailor Resume
                </Button>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2] font-display">Required Technical Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {analyzedJob.requiredSkills?.map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E1C19] text-[#E0693B] border border-[#E0693B]/25">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            {analyzedJob.preferredSkills?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2] font-display">Preferred / Nice-to-Have Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {analyzedJob.preferredSkills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E1C19] text-[#CDC5B6] border border-[#2D2925]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {analyzedJob.responsibilities?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2] font-display">Primary Responsibilities</span>
                <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[#CDC5B6]">
                  {analyzedJob.responsibilities.slice(0, 5).map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications */}
            {analyzedJob.qualifications?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2] font-display">Requirements & Qualifications</span>
                <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[#CDC5B6]">
                  {analyzedJob.qualifications.slice(0, 5).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Col: Transparent Match Breakdown */}
          <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-5">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#2EA366] font-bold">Skills Alignment Engine</span>
              <h4 className="text-base font-bold text-[#FAF7F2] font-display">Transparent Match Indicator</h4>
            </div>

            {/* Score Radial / Box */}
            <div className="p-4 rounded-xl bg-[#141312] border border-[#2D2925] text-center space-y-1">
              <span className="text-3xl font-extrabold text-[#E0693B] font-mono">
                {matchAnalysis?.matchScore || 75}%
              </span>
              <p className="text-[11px] text-[#9C9384]">Skills & Keyword Alignment</p>
            </div>

            {/* Matched Skills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#2EA366] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched In Your Profile ({matchAnalysis?.matchedSkills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1">
                {matchAnalysis?.matchedSkills?.map((m, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#2EA366]/10 text-[#2EA366] border border-[#2EA366]/20">
                    {m.name} ✓
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            {matchAnalysis?.missingSkills?.required?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Missing Skills ({matchAnalysis.missingSkills.required.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {matchAnalysis.missingSkills.required.map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/25">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-[#787165]">
                  NEXORA will never fabricate missing skills on your resume. Only add them if you genuinely possess them.
                </p>
              </div>
            )}

            {/* Tailoring Suggestions */}
            {matchAnalysis?.suggestions?.length > 0 && (
              <div className="space-y-2 border-t border-[#2D2925] pt-3">
                <span className="text-xs font-semibold text-[#FAF7F2] flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Actionable Recommendations
                </span>
                <div className="space-y-1.5 text-[11px] text-[#9C9384]">
                  {matchAnalysis.suggestions.map((s, idx) => (
                    <p key={idx} className="leading-relaxed">• {s}</p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#787165] italic border-t border-[#2D2925] pt-3">
              {matchAnalysis?.disclaimer || "Indicator reflects keyword and profile competency alignment, not a guaranteed hiring probability."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescriptionPanel;
