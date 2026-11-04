import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  Globe,
  FileCheck
} from "lucide-react";
import Button from "../common/Button";

export const ResumeProfileManager = ({
  profile,
  completion,
  onSave,
  isSaving = false
}) => {
  const [activeTab, setActiveTab] = useState("contact");
  const [formData, setFormData] = useState(profile || {});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateNested = (path, value) => {
    const copy = JSON.parse(JSON.stringify(formData));
    const parts = path.split(".");
    let curr = copy;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;
    setFormData(copy);
    setSaveSuccess(false);
  };

  const addItem = (section, defaultItem) => {
    const list = Array.isArray(formData[section]) ? [...formData[section]] : [];
    list.push(defaultItem);
    setFormData({ ...formData, [section]: list });
    setSaveSuccess(false);
  };

  const removeItem = (section, index) => {
    const list = Array.isArray(formData[section]) ? [...formData[section]] : [];
    list.splice(index, 1);
    setFormData({ ...formData, [section]: list });
    setSaveSuccess(false);
  };

  const updateItem = (section, index, field, value) => {
    const list = Array.isArray(formData[section]) ? [...formData[section]] : [];
    list[index] = { ...list[index], [field]: value };
    setFormData({ ...formData, [section]: list });
    setSaveSuccess(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!onSave) return;
    const res = await onSave(formData);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const pInfo = formData.personalInfo || {};
  const sectionsStatus = completion?.sections || {};

  const tabs = [
    { id: "contact", label: "Contact & Links", icon: User, complete: sectionsStatus.personalInfo },
    { id: "education", label: "Education", icon: GraduationCap, complete: sectionsStatus.education },
    { id: "experience", label: "Experience", icon: Briefcase, complete: sectionsStatus.experience },
    { id: "projects", label: "Projects", icon: Code2, complete: sectionsStatus.projects },
    { id: "skills", label: "Skills", icon: Code2, complete: sectionsStatus.skills },
    { id: "extras", label: "Certs & Awards", icon: Award, complete: sectionsStatus.certifications },
    { id: "languages", label: "Languages & Roles", icon: Globe, complete: sectionsStatus.languages }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Completion Checklist Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#4F7CFF]" />
              <h2 className="text-base font-bold text-[#172033] font-display">Resume Profile Health</h2>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F7CFF] border border-[#4F7CFF]/20">
                {completion?.percentage || 0}% Complete
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-1">
              Confirmed data is persistently stored and strictly grounded. AI generation never invents missing information.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSaving}
            className="shrink-0 flex items-center gap-1.5 shadow-sm shadow-[#4F7CFF]/25"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Profile Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save & Confirm Profile</span>
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EAECF0] rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4F7CFF] to-[#7C6CFA] transition-all duration-500 rounded-full"
            style={{ width: `${completion?.percentage || 0}%` }}
          />
        </div>

        {/* Section Badges */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? "bg-[#EEF2FF] border-[#4F7CFF]/30 text-[#4F7CFF] font-semibold"
                  : "bg-white border-[#E7EAF0] text-[#667085] hover:text-[#172033] hover:border-[#D0D5DD]"
              }`}
            >
              {t.complete ? (
                <CheckCircle2 className="w-3 h-3 text-[#12B76A]" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-500" />
              )}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabbed Form Container */}
      <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] shadow-xs space-y-6">
        {/* Tab 1: Contact & Links */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#172033] font-display">Personal Details & Professional Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={pInfo.fullName || ""}
                  onChange={(e) => updateNested("personalInfo.fullName", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">Default Target Role *</label>
                <input
                  type="text"
                  value={formData.targetRole || ""}
                  onChange={(e) => updateNested("targetRole", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                  placeholder="e.g. Backend Software Engineer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={pInfo.email || ""}
                  onChange={(e) => updateNested("personalInfo.email", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={pInfo.phone || ""}
                  onChange={(e) => updateNested("personalInfo.phone", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">Location / Residence</label>
                <input
                  type="text"
                  value={pInfo.location || ""}
                  onChange={(e) => updateNested("personalInfo.location", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                  placeholder="San Francisco, CA (or Remote)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={pInfo.linkedin || ""}
                  onChange={(e) => updateNested("personalInfo.linkedin", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">GitHub Profile</label>
                <input
                  type="url"
                  value={pInfo.github || ""}
                  onChange={(e) => updateNested("personalInfo.github", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#667085] mb-1">Portfolio or Website</label>
                <input
                  type="url"
                  value={pInfo.portfolio || pInfo.website || ""}
                  onChange={(e) => updateNested("personalInfo.portfolio", e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-2.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                  placeholder="https://myportfolio.dev"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#667085] mb-1">Professional Summary Bio</label>
              <textarea
                rows={3}
                value={formData.professionalSummary || ""}
                onChange={(e) => updateNested("professionalSummary", e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7EAF0] rounded-xl p-3 text-[#172033] text-xs leading-relaxed focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]"
                placeholder="2-3 sentence overview of your background, technical specialties, and career focus..."
              />
            </div>
          </div>
        )}

        {/* Tab 2: Education */}
        {activeTab === "education" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033] font-display">Academic Education</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addItem("education", {
                    degree: "Bachelor of Technology",
                    fieldOfStudy: "Computer Science",
                    institution: "",
                    location: "",
                    startDate: "2022",
                    endDate: "2026",
                    gpa: "",
                    coursework: []
                  })
                }
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </Button>
            </div>

            {formData.education?.length === 0 ? (
              <p className="text-xs text-[#667085] italic">No education entries added yet.</p>
            ) : (
              formData.education?.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#172033]">Degree #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem("education", idx)}
                      className="text-[#667085] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.Tech / B.S.)"
                      value={edu.degree || ""}
                      onChange={(e) => updateItem("education", idx, "degree", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="Field of Study (e.g. Computer Science)"
                      value={edu.fieldOfStudy || ""}
                      onChange={(e) => updateItem("education", idx, "fieldOfStudy", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="Institution / University Name"
                      value={edu.institution || ""}
                      onChange={(e) => updateItem("education", idx, "institution", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="Graduation Year / Dates (e.g. 2022 - 2026)"
                      value={edu.startDate ? `${edu.startDate} - ${edu.endDate || "Present"}` : edu.endDate || ""}
                      onChange={(e) => {
                        const [s, eDate] = e.target.value.split("-").map((v) => v.trim());
                        updateItem("education", idx, "startDate", s || "");
                        updateItem("education", idx, "endDate", eDate || "");
                      }}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="GPA (e.g. 3.8 / 4.0)"
                      value={edu.gpa || ""}
                      onChange={(e) => updateItem("education", idx, "gpa", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="Coursework (comma-separated, e.g. Algorithms, OS)"
                      value={Array.isArray(edu.coursework) ? edu.coursework.join(", ") : ""}
                      onChange={(e) =>
                        updateItem(
                          "education",
                          idx,
                          "coursework",
                          e.target.value.split(",").map((c) => c.trim()).filter(Boolean)
                        )
                      }
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Experience */}
        {activeTab === "experience" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033] font-display">Work Experience & Internships</h3>
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
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </Button>
            </div>

            {formData.experience?.length === 0 ? (
              <p className="text-xs text-[#667085] italic">No work experience added. Relevant projects will be highlighted.</p>
            ) : (
              formData.experience?.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#172033]">Role #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem("experience", idx)}
                      className="text-[#667085] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="Job Title (e.g. Software Engineer Intern)"
                      value={exp.title || ""}
                      onChange={(e) => updateItem("experience", idx, "title", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company || ""}
                      onChange={(e) => updateItem("experience", idx, "company", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
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
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={exp.location || ""}
                      onChange={(e) => updateItem("experience", idx, "location", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#667085] mb-1">Key Responsibilities / Bullet Points</label>
                    <textarea
                      rows={3}
                      placeholder="• Engineered microservices using Node.js..."
                      value={Array.isArray(exp.bulletPoints) ? exp.bulletPoints.join("\n") : ""}
                      onChange={(e) => updateItem("experience", idx, "bulletPoints", e.target.value.split("\n"))}
                      className="w-full bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] font-mono text-[11px] focus:outline-none focus:border-[#4F7CFF]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Projects */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033] font-display">Portfolio Projects</h3>
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
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </Button>
            </div>

            {formData.projects?.map((proj, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#172033]">Project #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("projects", idx)}
                    className="text-[#667085] hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={proj.title || ""}
                    onChange={(e) => updateItem("projects", idx, "title", e.target.value)}
                    className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack (comma-separated, e.g. React, Node.js, Redis)"
                    value={Array.isArray(proj.techStack) ? proj.techStack.join(", ") : ""}
                    onChange={(e) =>
                      updateItem(
                        "projects",
                        idx,
                        "techStack",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <input
                    type="text"
                    placeholder="GitHub Repo URL"
                    value={proj.githubUrl || ""}
                    onChange={(e) => updateItem("projects", idx, "githubUrl", e.target.value)}
                    className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <input
                    type="text"
                    placeholder="Live Deployment Demo URL"
                    value={proj.demoUrl || ""}
                    onChange={(e) => updateItem("projects", idx, "demoUrl", e.target.value)}
                    className="bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#667085] mb-1">Architecture & Accomplishment Bullets</label>
                  <textarea
                    rows={2}
                    placeholder="• Built resilient API handling async jobs..."
                    value={Array.isArray(proj.bulletPoints) ? proj.bulletPoints.join("\n") : ""}
                    onChange={(e) => updateItem("projects", idx, "bulletPoints", e.target.value.split("\n"))}
                    className="w-full bg-white border border-[#E7EAF0] rounded-lg p-2 text-[#172033] font-mono text-[11px] focus:outline-none focus:border-[#4F7CFF]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Skills */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033] font-display">Technical Skill Inventory</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addItem("skills", { name: "", category: "languages", level: 80, confirmed: true })}
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {formData.skills?.map((s, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Skill (e.g. TypeScript)"
                    value={s.name || ""}
                    onChange={(e) => updateItem("skills", idx, "name", e.target.value)}
                    className="flex-1 bg-white border border-[#E7EAF0] rounded px-2 py-1 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <select
                    value={s.category || "languages"}
                    onChange={(e) => updateItem("skills", idx, "category", e.target.value)}
                    className="bg-white border border-[#E7EAF0] rounded px-2 py-1 text-[#172033] text-[11px] cursor-pointer"
                  >
                    <option value="languages">Languages</option>
                    <option value="frameworks">Frameworks</option>
                    <option value="tools">Tools & DevOps</option>
                    <option value="databases">Databases</option>
                    <option value="soft_skills">Soft Skills</option>
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
            </div>
          </div>
        )}

        {/* Tab 6: Extras (Certs & Achievements) */}
        {activeTab === "extras" && (
          <div className="space-y-6">
            {/* Certifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F7CFF] font-display">Certifications</h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addItem("certifications", { name: "", issuer: "", issueDate: "" })}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>

              {formData.certifications?.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Cert Name (e.g. AWS Certified Solutions Architect)"
                    value={c.name || ""}
                    onChange={(e) => updateItem("certifications", idx, "name", e.target.value)}
                    className="flex-1 bg-[#F7F8FC] border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <input
                    type="text"
                    placeholder="Issuer"
                    value={c.issuer || ""}
                    onChange={(e) => updateItem("certifications", idx, "issuer", e.target.value)}
                    className="w-40 bg-[#F7F8FC] border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
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
            </div>

            {/* Achievements */}
            <div className="space-y-3 border-t border-[#E7EAF0] pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F7CFF] font-display">Achievements & Awards</h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addItem("achievements", { title: "", issuer: "", description: "" })}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>

              {formData.achievements?.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Award / Competition (e.g. Hackathon Finalist)"
                    value={a.title || ""}
                    onChange={(e) => updateItem("achievements", idx, "title", e.target.value)}
                    className="flex-1 bg-[#F7F8FC] border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <input
                    type="text"
                    placeholder="Issuer / Event"
                    value={a.issuer || ""}
                    onChange={(e) => updateItem("achievements", idx, "issuer", e.target.value)}
                    className="w-40 bg-[#F7F8FC] border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem("achievements", idx)}
                    className="text-[#667085] hover:text-rose-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Languages & Responsibilities */}
        {activeTab === "languages" && (
          <div className="space-y-6 text-xs">
            {/* Languages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F7CFF] font-display">Spoken / Written Languages</h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addItem("languages", { language: "", proficiency: "Fluent" })}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>

              {formData.languages?.map((l, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Language (e.g. English)"
                    value={l.language || ""}
                    onChange={(e) => updateItem("languages", idx, "language", e.target.value)}
                    className="flex-1 bg-[#F7F8FC] border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                  />
                  <select
                    value={l.proficiency || "Fluent"}
                    onChange={(e) => updateItem("languages", idx, "proficiency", e.target.value)}
                    className="bg-[#F7F8FC] border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] cursor-pointer"
                  >
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional">Professional</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Basic">Basic</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeItem("languages", idx)}
                    className="text-[#667085] hover:text-rose-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Positions of Responsibility */}
            <div className="space-y-3 border-t border-[#E7EAF0] pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F7CFF] font-display">Positions of Responsibility & Leadership</h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addItem("responsibilities", { role: "", organization: "", bulletPoints: [""] })}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>

              {formData.responsibilities?.map((r, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#172033]">Role #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem("responsibilities", idx)}
                      className="text-[#667085] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Leadership Role (e.g. Lead Organizer)"
                      value={r.role || ""}
                      onChange={(e) => updateItem("responsibilities", idx, "role", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                    <input
                      type="text"
                      placeholder="Organization / Club"
                      value={r.organization || ""}
                      onChange={(e) => updateItem("responsibilities", idx, "organization", e.target.value)}
                      className="bg-white border border-[#E7EAF0] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#4F7CFF]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeProfileManager;
