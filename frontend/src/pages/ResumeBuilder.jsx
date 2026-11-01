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
  Check
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
      <div className="p-5 sm:p-6 rounded-2xl bg-[#191816] border border-[#2D2925] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E0693B] font-display">
              Career Intelligence Engine
            </span>
            <Badge variant="success" size="xs" dot>
              Verified Grounded Facts
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#FAF7F2] font-display">
            Resume Intelligence & ATS Showcase
          </h1>
          <p className="text-xs text-[#9C9384] max-w-2xl">
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
            <Upload className="w-3.5 h-3.5 text-[#E0693B]" /> Import PDF/Word
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSavedModalOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#9C9384]" /> Saved Resumes
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleGenerateTailored()}
            isLoading={isGenerating}
            className="text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> ✨ AI Tailor
          </Button>
        </div>
      </div>

      {/* Notifications & Errors */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-[#2EA366]/10 border border-[#2EA366]/20 text-[#2EA366] text-xs flex items-center justify-between animate-fade-in no-print">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner("")} className="text-[#2EA366] hover:opacity-75">✕</button>
        </div>
      )}

      {error && (
        <div className="no-print">
          <ErrorMessage title="Resume Engine Notice" message={error} onRetry={loadInitialData} />
        </div>
      )}

      {/* 2. Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2925] pb-2 no-print">
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
            <div className="flex items-center gap-1.5 text-xs bg-[#191816] border border-[#2D2925] px-2.5 py-1.5 rounded-xl">
              <span className="text-[#787165] font-medium">Template:</span>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent text-[#FAF7F2] focus:outline-none font-medium cursor-pointer"
              >
                <option value="modern" className="bg-[#191816]">Modern Minimal</option>
                <option value="classic" className="bg-[#191816]">Classic Professional</option>
                <option value="technical" className="bg-[#191816]">Technical / SWE</option>
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
          <div className="flex sm:hidden justify-between items-center bg-[#191816] p-2 rounded-xl border border-[#2D2925] no-print">
            <span className="text-xs font-semibold text-[#FAF7F2]">View Mode:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMobileView("edit")}
                className={`px-3 py-1 rounded text-xs ${mobileView === "edit" ? "bg-[#E0693B] text-white" : "text-[#9C9384]"}`}
              >
                <Edit3 className="w-3 h-3 inline mr-1" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setMobileView("preview")}
                className={`px-3 py-1 rounded text-xs ${mobileView === "preview" ? "bg-[#E0693B] text-white" : "text-[#9C9384]"}`}
              >
                <Eye className="w-3 h-3 inline mr-1" /> Preview
              </button>
            </div>
          </div>

          {/* Split Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Section Editor (5 cols on lg) */}
            <div className={`lg:col-span-5 space-y-4 no-print ${mobileView === "preview" ? "hidden sm:block" : "block"}`}>
              <div className="p-4 rounded-xl bg-[#191816] border border-[#2D2925] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2] font-display">
                    Interactive Resume Editor
                  </h3>
                  <p className="text-[11px] text-[#9C9384]">Edits render immediately in the live preview.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="text-xs text-[#E0693B] p-0 h-auto"
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
              <div className="p-3.5 rounded-xl bg-[#191816] border border-[#2D2925] flex flex-wrap items-center justify-between gap-2 text-xs no-print">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2EA366] animate-pulse" />
                  <span className="font-semibold text-[#FAF7F2]">Live ATS Preview</span>
                  <span className="text-[11px] text-[#787165]">| Selectable text</span>
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
          <p className="text-xs text-[#9C9384]">
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
