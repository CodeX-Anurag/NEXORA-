import React, { useState } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Cpu,
  Award,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Button from "../common/Button";

export const ResumeEditor = ({
  resumeData,
  onChange,
  onAiSectionAssist,
  isAiAssisting = false
}) => {
  const [openSections, setOpenSections] = useState({
    personal: true,
    summary: true,
    experience: true,
    projects: true,
    skills: false,
    education: false,
    certifications: false
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!resumeData) return null;

  const updateField = (path, value) => {
    const next = JSON.parse(JSON.stringify(resumeData));
    const parts = path.split(".");
    let curr = next;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;
    onChange(next);
  };

  // Helper to add and remove items from arrays
  const addItem = (section, defaultItem) => {
    const list = Array.isArray(resumeData[section]) ? [...resumeData[section]] : [];
    list.push(defaultItem);
    onChange({ ...resumeData, [section]: list });
  };

  const removeItem = (section, index) => {
    const list = Array.isArray(resumeData[section]) ? [...resumeData[section]] : [];
    list.splice(index, 1);
    onChange({ ...resumeData, [section]: list });
  };

  const updateItem = (section, index, field, value) => {
    const list = Array.isArray(resumeData[section]) ? [...resumeData[section]] : [];
    list[index] = { ...list[index], [field]: value };
    onChange({ ...resumeData, [section]: list });
  };

  const handleAiSummary = async () => {
    if (!onAiSectionAssist) return;
    await onAiSectionAssist("summary", resumeData.professionalSummary || resumeData.summary || "");
  };

  const handleAiBullets = async (section, index, text) => {
    if (!onAiSectionAssist) return;
    const bullets = await onAiSectionAssist("bulletPoints", text, {
      title: resumeData[section][index]?.title,
      company: resumeData[section][index]?.company,
      techStack: resumeData[section][index]?.techStack
    });
    if (Array.isArray(bullets)) {
      updateItem(section, index, "bulletPoints", bullets);
    }
  };

  const pInfo = resumeData.personalInfo || {};

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Personal Information */}
      <div className="rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("personal")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8FC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-display font-semibold text-[#172033] dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <User className="w-4 h-4" />
            </span>
            <span>Personal Details & Contact</span>
          </div>
          {openSections.personal ? <ChevronUp className="w-4 h-4 text-[#667085] dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-[#667085] dark:text-slate-400" />}
        </button>

        {openSections.personal && (
          <div className="p-4 pt-1 space-y-3 border-t border-[#E7EAF0] dark:border-[#1F2937] bg-[#F7F8FC]/40 dark:bg-slate-900/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={pInfo.fullName || pInfo.name || ""}
                  onChange={(e) => updateField("personalInfo.fullName", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">Target Role</label>
                <input
                  type="text"
                  value={resumeData.targetRole || ""}
                  onChange={(e) => updateField("targetRole", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                  placeholder="e.g. Full Stack Engineer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={pInfo.email || ""}
                  onChange={(e) => updateField("personalInfo.email", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={pInfo.phone || ""}
                  onChange={(e) => updateField("personalInfo.phone", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={pInfo.location || ""}
                  onChange={(e) => updateField("personalInfo.location", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                  placeholder="City, State / Remote"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={pInfo.linkedin || ""}
                  onChange={(e) => updateField("personalInfo.linkedin", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={pInfo.github || ""}
                  onChange={(e) => updateField("personalInfo.github", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#667085] dark:text-slate-400 mb-1">Portfolio / Website</label>
                <input
                  type="text"
                  value={pInfo.portfolio || pInfo.website || ""}
                  onChange={(e) => updateField("personalInfo.portfolio", e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Professional Summary */}
      <div className="rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("summary")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8FC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-display font-semibold text-[#172033] dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>Professional Summary</span>
          </div>
          {openSections.summary ? <ChevronUp className="w-4 h-4 text-[#667085] dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-[#667085] dark:text-slate-400" />}
        </button>

        {openSections.summary && (
          <div className="p-4 pt-1 space-y-2 border-t border-[#E7EAF0] dark:border-[#1F2937] bg-[#F7F8FC]/40 dark:bg-slate-900/40">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] text-[#667085] dark:text-slate-400">2-3 sentence executive summary</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAiSummary}
                isLoading={isAiAssisting}
                className="text-[11px] text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1 p-0 h-auto font-semibold"
              >
                <Sparkles size={12} />
                <span>AI Polish</span>
              </Button>
            </div>
            <textarea
              rows={3}
              value={resumeData.professionalSummary || resumeData.summary || ""}
              onChange={(e) => updateField("professionalSummary", e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-xl p-3 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-xs leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 3. Work Experience */}
      <div className="rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("experience")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8FC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-display font-semibold text-[#172033] dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-4 h-4" />
            </span>
            <span>Work Experience & Internships ({resumeData.experience?.length || 0})</span>
          </div>
          {openSections.experience ? <ChevronUp className="w-4 h-4 text-[#667085] dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-[#667085] dark:text-slate-400" />}
        </button>

        {openSections.experience && (
          <div className="p-4 pt-1 space-y-4 border-t border-[#E7EAF0] dark:border-[#1F2937] bg-[#F7F8FC]/40 dark:bg-slate-900/40">
            {resumeData.experience?.map((exp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#172033] dark:text-slate-100 font-display text-xs">Experience #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("experience", idx)}
                    className="text-[#667085] hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={exp.title || ""}
                    onChange={(e) => updateItem("experience", idx, "title", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company || ""}
                    onChange={(e) => updateItem("experience", idx, "company", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Dates (e.g. Jun 2024 - Aug 2024)"
                    value={exp.startDate ? `${exp.startDate} - ${exp.endDate || "Present"}` : exp.endDate || ""}
                    onChange={(e) => {
                      const [s, eDate] = e.target.value.split("-").map((v) => v.trim());
                      updateItem("experience", idx, "startDate", s || "");
                      updateItem("experience", idx, "endDate", eDate || "");
                    }}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={exp.location || ""}
                    onChange={(e) => updateItem("experience", idx, "location", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400">Bullet Points (1 per line)</span>
                    <button
                      type="button"
                      onClick={() => handleAiBullets("experience", idx, (exp.bulletPoints || []).join("\n") || exp.description)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-semibold flex items-center gap-1"
                    >
                      <Sparkles size={11} />
                      <span>Polish Bullets</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="• Developed backend REST API microservices..."
                    value={(exp.bulletPoints || []).join("\n")}
                    onChange={(e) => updateItem("experience", idx, "bulletPoints", e.target.value.split("\n"))}
                    className="w-full bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg p-2.5 text-[#172033] dark:text-slate-100 font-mono text-[11px] focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                addItem("experience", {
                  title: "",
                  company: "",
                  location: "",
                  startDate: "",
                  endDate: "Present",
                  bulletPoints: [""]
                })
              }
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Experience
            </Button>
          </div>
        )}
      </div>

      {/* 4. Portfolio Projects */}
      <div className="rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("projects")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8FC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-display font-semibold text-[#172033] dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
              <FolderGit2 className="w-4 h-4" />
            </span>
            <span>Portfolio Projects ({resumeData.projects?.length || 0})</span>
          </div>
          {openSections.projects ? <ChevronUp className="w-4 h-4 text-[#667085] dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-[#667085] dark:text-slate-400" />}
        </button>

        {openSections.projects && (
          <div className="p-4 pt-1 space-y-4 border-t border-[#E7EAF0] dark:border-[#1F2937] bg-[#F7F8FC]/40 dark:bg-slate-900/40">
            {resumeData.projects?.map((proj, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#172033] dark:text-slate-100 font-display text-xs">Project #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("projects", idx)}
                    className="text-[#667085] hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={proj.title || ""}
                    onChange={(e) => updateItem("projects", idx, "title", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack (comma-separated, e.g. React, Node.js)"
                    value={Array.isArray(proj.techStack) ? proj.techStack.join(", ") : ""}
                    onChange={(e) =>
                      updateItem(
                        "projects",
                        idx,
                        "techStack",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="GitHub URL"
                    value={proj.githubUrl || ""}
                    onChange={(e) => updateItem("projects", idx, "githubUrl", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Live Demo URL"
                    value={proj.demoUrl || ""}
                    onChange={(e) => updateItem("projects", idx, "demoUrl", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400">Bullet Points (1 per line)</span>
                    <button
                      type="button"
                      onClick={() => handleAiBullets("projects", idx, (proj.bulletPoints || []).join("\n") || proj.description)}
                      className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-semibold flex items-center gap-1"
                    >
                      <Sparkles size={11} />
                      <span>Polish Bullets</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="• Built a full-stack platform using Node.js..."
                    value={(proj.bulletPoints || []).join("\n")}
                    onChange={(e) => updateItem("projects", idx, "bulletPoints", e.target.value.split("\n"))}
                    className="w-full bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg p-2.5 text-[#172033] dark:text-slate-100 font-mono text-[11px] focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                addItem("projects", {
                  title: "",
                  description: "",
                  techStack: [],
                  bulletPoints: [""],
                  githubUrl: "",
                  demoUrl: ""
                })
              }
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Project
            </Button>
          </div>
        )}
      </div>

      {/* 5. Technical Skills */}
      <div className="rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("skills")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8FC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-display font-semibold text-[#172033] dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-4 h-4" />
            </span>
            <span>Technical Skills ({Array.isArray(resumeData.skills) ? resumeData.skills.length : "Categorized"})</span>
          </div>
          {openSections.skills ? <ChevronUp className="w-4 h-4 text-[#667085] dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-[#667085] dark:text-slate-400" />}
        </button>

        {openSections.skills && (
          <div className="p-4 pt-1 space-y-3 border-t border-[#E7EAF0] dark:border-[#1F2937] bg-[#F7F8FC]/40 dark:bg-slate-900/40">
            {Array.isArray(resumeData.skills) ? (
              <div className="space-y-2">
                {resumeData.skills.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Skill name"
                      value={typeof s === "string" ? s : s.name || ""}
                      onChange={(e) => updateItem("skills", idx, "name", e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={s.category || "languages"}
                      onChange={(e) => updateItem("skills", idx, "category", e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="languages">Languages</option>
                      <option value="frameworks">Frameworks & Libs</option>
                      <option value="tools">Developer Tools</option>
                      <option value="databases">Databases</option>
                      <option value="soft_skills">Core Competencies</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeItem("skills", idx)}
                      className="text-[#667085] hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addItem("skills", { name: "", category: "languages", level: 80 })}
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </Button>
              </div>
            ) : (
              <p className="text-xs text-[#667085] dark:text-slate-400">Skills are dynamically linked to your verified NEXORA competency matrix.</p>
            )}
          </div>
        )}
      </div>

      {/* 6. Education */}
      <div className="rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("education")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8FC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-display font-semibold text-[#172033] dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span>Education ({resumeData.education?.length || 0})</span>
          </div>
          {openSections.education ? <ChevronUp className="w-4 h-4 text-[#667085] dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-[#667085] dark:text-slate-400" />}
        </button>

        {openSections.education && (
          <div className="p-4 pt-1 space-y-3 border-t border-[#E7EAF0] dark:border-[#1F2937] bg-[#F7F8FC]/40 dark:bg-slate-900/40">
            {resumeData.education?.map((edu, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#172033] dark:text-slate-100 font-display text-xs">Education #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("education", idx)}
                    className="text-[#667085] hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Degree (e.g. B.S. in Computer Science)"
                    value={edu.degree || ""}
                    onChange={(e) => updateItem("education", idx, "degree", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Institution / University"
                    value={edu.institution || ""}
                    onChange={(e) => updateItem("education", idx, "institution", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Dates (e.g. 2021 - 2025)"
                    value={edu.startDate ? `${edu.startDate} - ${edu.endDate || "Present"}` : edu.endDate || ""}
                    onChange={(e) => {
                      const [s, eDate] = e.target.value.split("-").map((v) => v.trim());
                      updateItem("education", idx, "startDate", s || "");
                      updateItem("education", idx, "endDate", eDate || "");
                    }}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="GPA (e.g. 3.8 / 4.0)"
                    value={edu.gpa || ""}
                    onChange={(e) => updateItem("education", idx, "gpa", e.target.value)}
                    className="bg-[#F7F8FC] dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                addItem("education", {
                  degree: "Bachelor of Science",
                  fieldOfStudy: "Computer Science",
                  institution: "",
                  startDate: "2022",
                  endDate: "2026",
                  gpa: ""
                })
              }
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Education
            </Button>
          </div>
        )}
      </div>

      {/* 7. Certifications */}
      <div className="rounded-2xl border border-[#E7EAF0] dark:border-[#1F2937] bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("certifications")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8FC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-display font-semibold text-[#172033] dark:text-slate-100">
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Award className="w-4 h-4" />
            </span>
            <span>Certifications & Milestones ({resumeData.certifications?.length || 0})</span>
          </div>
          {openSections.certifications ? <ChevronUp className="w-4 h-4 text-[#667085] dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-[#667085] dark:text-slate-400" />}
        </button>

        {openSections.certifications && (
          <div className="p-4 pt-1 space-y-3 border-t border-[#E7EAF0] dark:border-[#1F2937] bg-[#F7F8FC]/40 dark:bg-slate-900/40">
            {resumeData.certifications?.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={c.name || ""}
                  onChange={(e) => updateItem("certifications", idx, "name", e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
                <input
                  type="text"
                  placeholder="Issuer"
                  value={c.issuer || ""}
                  onChange={(e) => updateItem("certifications", idx, "issuer", e.target.value)}
                  className="w-40 bg-white dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => removeItem("certifications", idx)}
                  className="text-[#667085] hover:text-rose-500 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => addItem("certifications", { name: "", issuer: "", issueDate: "" })}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certification
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;
