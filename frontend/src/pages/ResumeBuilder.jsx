import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  UserCheck,
  Briefcase,
  Download,
  Upload,
  Save,
  FolderOpen,
  Sparkles,
  Printer,
  Eye,
  Edit3,
  Copy,
  Check,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import resumeService from "../services/resume.service";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import TabNav from "../components/common/TabNav";
import Badge from "../components/common/Badge";
import ResumePreview from "../components/resume/ResumePreview";
import ResumeEditor from "../components/resume/ResumeEditor";
import ResumeProfileManager from "../components/resume/ResumeProfileManager";
import ResumeImportModal from "../components/resume/ResumeImportModal";
import JobDescriptionPanel from "../components/resume/JobDescriptionPanel";
import SavedResumesModal from "../components/resume/SavedResumesModal";

export const ResumeBuilder = () => {
  const { accessToken } = useAuth();

  // Navigation Tabs: "workspace" | "profile" | "job"
  const [activeTab, setActiveTab] = useState("workspace");

  // Mobile split view toggle: "edit" | "preview"
  const [mobileView, setMobileView] = useState("preview");

  // Profile & Completion State
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);

  // Active Resume Document State (Used by Editor and Preview)
  const [resumeData, setResumeData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [activeJobContext, setActiveJobContext] = useState(null);

  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [error, setError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");
  const [copiedMd, setCopiedMd] = useState(false);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitleInput, setSaveTitleInput] = useState("");

  /**
   * 1. Initial Data Fetching: Retrieve user's confirmed Profile & synthesized resume
   */
  const loadInitialData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const [profileRes, legacyResumeRes] = await Promise.all([
        resumeService.getResumeProfile(accessToken),
        resumeService.getResume(accessToken).catch(() => null)
      ]);

      if (profileRes?.profile) {
        setProfile(profileRes.profile);
        setCompletion(profileRes.completion);

        // Pre-fill active workspace with confirmed profile data
        const initialDoc = {
          personalInfo: profileRes.profile.personalInfo,
          targetRole: profileRes.profile.targetRole || "Software Engineer",
          professionalSummary: profileRes.profile.professionalSummary || legacyResumeRes?.resume?.summary || "",
          education: profileRes.profile.education || [],
          skills: profileRes.profile.skills || [],
          experience: profileRes.profile.experience || [],
          projects: profileRes.profile.projects || legacyResumeRes?.resume?.projects || [],
          certifications: profileRes.profile.certifications || [],
          achievements: profileRes.profile.achievements || legacyResumeRes?.resume?.achievements || [],
          responsibilities: profileRes.profile.responsibilities || [],
          languages: profileRes.profile.languages || [{ language: "English", proficiency: "Professional" }]
        };

        setResumeData(initialDoc);
      }
    } catch (err) {
      setError(err.message || "Failed to load resume intelligence data.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const showNotification = (msg) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(""), 4000);
  };

  /**
   * 2. Save confirmed Profile (from Profile tab)
   */
  const handleSaveProfile = async (updatedProfile) => {
    if (!accessToken) return;
    try {
      const res = await resumeService.saveResumeProfile(accessToken, updatedProfile);
      if (res?.profile) {
        setProfile(res.profile);
        setCompletion(res.completion);
        showNotification("Resume profile saved persistently to your NEXORA account.");
        return res;
      }
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    }
  };

  /**
   * 3. AI Section Assist
   */
  const handleAiSectionAssist = async (sectionType, currentContent, context = {}) => {
    if (!accessToken) return;
    setIsAiAssisting(true);
    try {
      const res = await resumeService.improveSectionAi(accessToken, {
        sectionType,
        currentContent,
        context,
        targetRole: resumeData?.targetRole || "Software Engineer"
      });

      if (res?.success) {
        if (sectionType === "summary") {
          setResumeData((prev) => ({ ...prev, professionalSummary: res.result }));
          showNotification("Summary enhanced with Gemini AI.");
        }
        return res.result;
      }
    } catch (err) {
      setError(err.message || "Failed to run AI section assist.");
    } finally {
      setIsAiAssisting(false);
    }
  };

  /**
   * 4. Full AI Tailor / Generation
   */
  const handleGenerateTailored = async (options = {}) => {
    if (!accessToken) return;
    setIsGenerating(true);
    setError("");

    try {
      const payload = {
        template: selectedTemplate,
        targetRole: options.targetRole || resumeData?.targetRole,
        targetCompany: options.targetCompany || "",
        jobDescription: options.jobDescription || activeJobContext,
        profileOverride: profile
      };

      const res = await resumeService.generateTailoredResume(accessToken, payload);

      if (res?.resumeData) {
        setResumeData(res.resumeData);
        if (options.jobDescription) {
          setActiveJobContext(options.jobDescription);
        }
        setActiveTab("workspace");
        showNotification("Resume tailored successfully with Gemini AI.");
      }
    } catch (err) {
      setError(err.message || "Failed to generate tailored resume.");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 5. Open Save Modal for Resume
   */
  const handleSaveCurrentResume = () => {
    if (!resumeData) return;
    const defaultTitle = `${resumeData.personalInfo?.fullName || "My"} - ${resumeData.targetRole || "Resume"}`;
    setSaveTitleInput(defaultTitle);
    setIsSaveModalOpen(true);
  };

  /**
   * 5B. Confirm Save Resume
   */
  const handleConfirmSaveResume = async (e) => {
    if (e) e.preventDefault();
    if (!accessToken || !resumeData) return;
    const title = saveTitleInput.trim() || `${resumeData.personalInfo?.fullName || "My"} - ${resumeData.targetRole || "Resume"}`;

    setIsSavingResume(true);
    try {
      await resumeService.createSavedResume(accessToken, {
        title,
        targetRole: resumeData.targetRole,
        template: selectedTemplate,
        resumeData,
        jobDescription: activeJobContext
      });

      setIsSaveModalOpen(false);
      showNotification("Resume saved to your NEXORA account!");
    } catch (err) {
      setError(err.message || "Failed to save resume.");
    } finally {
      setIsSavingResume(false);
    }
  };

  /**
   * 6. Download Binary PDF Export
   */
  const handleDownloadPdf = async () => {
    if (!accessToken || !resumeData) return;
    try {
      showNotification("Generating selectable-text PDF...");
      const blob = await resumeService.downloadPdf(accessToken, {
        resumeData,
        template: selectedTemplate
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(resumeData.personalInfo?.fullName || "Candidate").replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to download PDF.");
    }
  };

  /**
   * 7. Download Binary DOCX Export
   */
  const handleDownloadDocx = async () => {
    if (!accessToken || !resumeData) return;
    try {
      showNotification("Generating formatted DOCX...");
      const blob = await resumeService.downloadDocx(accessToken, {
        resumeData,
        template: selectedTemplate
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(resumeData.personalInfo?.fullName || "Candidate").replace(/\s+/g, "_")}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to download DOCX.");
    }
  };

  /**
   * 8. Browser Vector Print
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * 9. Copy Markdown
   */
  const handleCopyMarkdown = async () => {
    if (!accessToken) return;
    try {
      const res = await resumeService.exportResume(accessToken, "markdown");
      if (res?.export) {
        navigator.clipboard.writeText(res.export);
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 2000);
        showNotification("Markdown copied to clipboard!");
      }
    } catch {
      setError("Failed to copy markdown.");
    }
  };

  /**
   * 10. Load Saved Resume from Modal
   */
  const handleSelectSavedResume = (saved) => {
    if (saved?.resumeData) {
      setResumeData(saved.resumeData);
      if (saved.template) setSelectedTemplate(saved.template);
      if (saved.jobDescription) setActiveJobContext(saved.jobDescription);
      setActiveTab("workspace");
      showNotification(`Loaded "${saved.title}"`);
    }
  };

  /**
   * 11. Apply Extracted Data from PDF/DOCX Import
   */
  const handleApplyImportedData = (imported) => {
    const current = profile || {};
    const updated = {
      ...current,
      personalInfo: {
        ...(current.personalInfo || {}),
        ...(imported.personalInfo || {})
      },
      targetRole: imported.targetRole || current.targetRole || "Software Engineer",
      professionalSummary: imported.professionalSummary || current.professionalSummary || "",
      education: imported.education?.length ? imported.education : (current.education || []),
      skills: imported.skills?.length ? imported.skills : (current.skills || []),
      experience: imported.experience?.length ? imported.experience : (current.experience || []),
      projects: imported.projects?.length ? imported.projects : (current.projects || []),
      certifications: imported.certifications?.length ? imported.certifications : (current.certifications || []),
      achievements: imported.achievements?.length ? imported.achievements : (current.achievements || [])
    };

    handleSaveProfile(updated);
    setResumeData(updated);
    showNotification("Imported resume details applied to your profile!");
  };

  if (isLoading) {
    return <Loader text="Loading NEXORA Resume Intelligence Engine..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* 1. Header Toolbar */}
      <div className="relative p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111827] border border-rose-200/60 dark:border-rose-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm overflow-hidden no-print">
        {/* Top Rose accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-display flex items-center gap-1.5">
              <Sparkles size={14} className="text-rose-500" />
              Career Intelligence Engine
            </span>
            <Badge variant="emerald" size="xs" withDot>
              Verified Grounded Facts
            </Badge>
            {completion && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                Profile: {completion.percentage || 0}% Complete
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-slate-100 font-display">
            Resume Intelligence & ATS Showcase
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-2xl leading-relaxed">
            Synthesize, tailor, and export verifiable resumes tailored to technical job descriptions using Gemini AI and your confirmed profile.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-rose-500" /> Import PDF/Word
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSavedModalOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#667085] dark:text-slate-400" /> Saved Resumes
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleGenerateTailored()}
            isLoading={isGenerating}
            className="text-xs flex items-center gap-1.5 shadow-sm shadow-rose-500/25 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 border-none text-white font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tailor</span>
          </Button>
        </div>
      </div>

      {/* Notifications & Errors */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF3] dark:bg-emerald-950/40 border border-[#A6F4C5] dark:border-emerald-800/40 text-[#027A48] dark:text-emerald-300 text-xs flex items-center justify-between animate-fade-in no-print shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner("")}
            className="text-[#027A48] dark:text-emerald-300 hover:opacity-75 font-bold cursor-pointer p-1 rounded-lg hover:bg-[#D1FADF]/60 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="no-print">
          <ErrorMessage title="Resume Engine Notice" message={error} onRetry={loadInitialData} />
        </div>
      )}

      {/* 2. Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF0] dark:border-slate-800 pb-2 no-print">
        <TabNav
          tabs={[
            { id: "workspace", label: "Workspace & Live Preview", icon: FileText },
            {
              id: "profile",
              label: "Master Profile",
              icon: UserCheck,
              badge: `${completion?.percentage || 0}%`
            },
            { id: "job", label: "Job Tailor & Match", icon: Briefcase }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Workspace Toolbar: Template & Export (Visible when in Workspace) */}
        {activeTab === "workspace" && (
          <div className="hidden sm:flex items-center gap-2">
            {/* Template Selector */}
            <div className="flex items-center gap-1.5 text-xs bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 px-2.5 py-1.5 rounded-xl shadow-xs">
              <span className="text-[#667085] dark:text-slate-400 font-medium">Template:</span>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent text-[#172033] dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
              >
                <option value="modern" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Modern Minimal</option>
                <option value="classic" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Classic Professional</option>
                <option value="technical" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Technical / SWE</option>
              </select>
            </div>

            {/* Quick Export Actions */}
            <Button variant="secondary" size="sm" onClick={handleDownloadPdf} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadDocx} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> DOCX
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint} className="text-xs" title="Print to PDF">
              <Printer className="w-3.5 h-3.5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSaveCurrentResume} isLoading={isSavingResume} className="text-xs">
              <Save className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
          </div>
        )}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: WORKSPACE & LIVE PREVIEW (SPLIT SCREEN) */}
      {activeTab === "workspace" && (
        <div className="space-y-4">
          {/* Mobile Edit/Preview Switcher */}
          <div className="flex sm:hidden justify-between items-center bg-white dark:bg-[#111827] p-2 rounded-xl border border-[#E7EAF0] dark:border-[#1F2937] shadow-xs no-print">
            <span className="text-xs font-semibold text-[#172033] dark:text-slate-200">View Mode:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMobileView("edit")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mobileView === "edit" ? "bg-rose-500 text-white" : "text-[#667085] dark:text-slate-400"}`}
              >
                <Edit3 className="w-3 h-3 inline mr-1" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setMobileView("preview")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mobileView === "preview" ? "bg-rose-500 text-white" : "text-[#667085] dark:text-slate-400"}`}
              >
                <Eye className="w-3 h-3 inline mr-1" /> Preview
              </button>
            </div>
          </div>

          {/* Split Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Section Editor (5 cols on lg) */}
            <div className={`lg:col-span-5 space-y-4 no-print ${mobileView === "preview" ? "hidden sm:block" : "block"}`}>
              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-slate-100 font-display">
                    Interactive Resume Editor
                  </h3>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400">Edits render immediately in the live preview.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="text-xs text-rose-600 dark:text-rose-400 p-0 h-auto font-semibold"
                >
                  <Copy className="w-3 h-3 inline mr-1" /> {copiedMd ? "Copied" : "Copy .md"}
                </Button>
              </div>

              <ResumeEditor
                resumeData={resumeData}
                onChange={setResumeData}
                onAiSectionAssist={handleAiSectionAssist}
                isAiAssisting={isAiAssisting}
              />
            </div>

            {/* Right Column: Live High-Fidelity Resume Document (7 cols on lg) */}
            <div className={`lg:col-span-7 space-y-4 ${mobileView === "edit" ? "hidden sm:block" : "block"}`}>
              {/* Document Actions Bar on Top of Preview */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E7EAF0] shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs no-print">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A] animate-pulse" />
                  <span className="font-semibold text-[#172033]">Live ATS Preview</span>
                  <span className="text-[11px] text-[#667085]">| Selectable text</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleDownloadPdf} className="text-xs">
                    Download PDF
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleDownloadDocx} className="text-xs">
                    Download Word
                  </Button>
                </div>
              </div>

              {/* Printable Live Document Component */}
              <ResumePreview resumeData={resumeData} template={selectedTemplate} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER RESUME PROFILE */}
      {activeTab === "profile" && (
        <ResumeProfileManager
          profile={profile}
          completion={completion}
          onSave={handleSaveProfile}
          isSaving={isSavingResume}
        />
      )}

      {/* TAB 3: JOB TAILORING & RESEARCH */}
      {activeTab === "job" && (
        <JobDescriptionPanel
          accessToken={accessToken}
          profile={profile}
          onTailorResume={handleGenerateTailored}
          isTailoring={isGenerating}
          initialJob={activeJobContext}
        />
      )}

      {/* Import Modal */}
      <ResumeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        accessToken={accessToken}
        onApplyImportedData={handleApplyImportedData}
      />

      {/* Saved Resumes Modal */}
      <SavedResumesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        accessToken={accessToken}
        onSelectResume={handleSelectSavedResume}
      />

      {/* Save Resume Modal (Replaces window.prompt) */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Save Resume to Account"
      >
        <form onSubmit={handleConfirmSaveResume} className="space-y-4">
          <Input
            label="Resume Document Title"
            value={saveTitleInput}
            onChange={(e) => setSaveTitleInput(e.target.value)}
            placeholder="e.g. Full Stack Developer - Tailored"
            required
            autoFocus
          />
          <p className="text-xs text-[#667085]">
            This saves your tailored resume document snapshot persistently to your NEXORA account.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsSaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingResume}
            >
              Save Resume
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResumeBuilder;
