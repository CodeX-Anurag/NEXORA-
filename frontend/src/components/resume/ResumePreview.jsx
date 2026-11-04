import React from "react";
import { ExternalLink, Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";

export const ResumePreview = ({ resumeData, template = "modern", id = "resume-preview-sheet" }) => {
  if (!resumeData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[#667085] bg-white rounded-2xl border border-dashed border-[#E7EAF0] h-full min-h-[500px] shadow-xs">
        <p className="text-sm font-semibold text-[#172033]">No resume content generated yet.</p>
        <p className="text-xs text-[#667085] mt-1">Select your profile data and click Generate to preview your resume.</p>
      </div>
    );
  }

  const pInfo = resumeData.personalInfo || {};
  const isClassic = template === "classic";
  const isTechnical = template === "technical";

  // Font and color palettes based on template
  const fontFamily = isClassic
    ? "font-serif"
    : isTechnical
    ? "font-mono"
    : "font-sans";

  const primaryAccent = isClassic
    ? "text-slate-900 border-slate-700"
    : isTechnical
    ? "text-emerald-700 border-emerald-600"
    : "text-[#4F7CFF] border-[#4F7CFF]";

  const headerAlign = isClassic ? "text-center" : "text-left";

  const contactList = [
    pInfo.email && { icon: Mail, label: pInfo.email, href: `mailto:${pInfo.email}` },
    pInfo.phone && { icon: Phone, label: pInfo.phone, href: `tel:${pInfo.phone}` },
    pInfo.location && { icon: MapPin, label: pInfo.location },
    pInfo.linkedin && { icon: Linkedin, label: "LinkedIn", href: pInfo.linkedin },
    pInfo.github && { icon: Github, label: "GitHub", href: pInfo.github },
    pInfo.portfolio && { icon: Globe, label: "Portfolio", href: pInfo.portfolio },
    pInfo.website && { icon: Globe, label: "Website", href: pInfo.website }
  ].filter(Boolean);

  const skills = resumeData.skills;
  const isArraySkills = Array.isArray(skills);

  return (
    <div className="w-full flex justify-center bg-[#F1F4F9] dark:bg-slate-950 p-3 sm:p-6 rounded-2xl border border-[#E7EAF0] dark:border-slate-800 overflow-auto shadow-xs">
      {/* Simulated 8.5x11 high-contrast printable document sheet */}
      <div
        id={id}
        className={`w-full max-w-[850px] min-h-[1050px] !bg-white !text-slate-900 shadow-xl border border-[#E7EAF0] p-8 sm:p-12 text-[13px] leading-relaxed select-text ${fontFamily}`}
        style={{ colorScheme: "light", backgroundColor: "#FFFFFF", color: "#0F172A" }}
      >
        {/* Document Header - Guaranteed transparent in both day and night mode */}
        <header
          className={`resume-header-block border-b pb-4 mb-5 ${headerAlign} border-slate-300 !bg-transparent`}
          style={{ backgroundColor: "transparent", backdropFilter: "none" }}
        >
          <h1 className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-950 ${isClassic ? "tracking-widest" : ""}`}>
            {pInfo.fullName || pInfo.name || "Candidate Name"}
          </h1>

          {resumeData.targetRole && (
            <p className={`text-sm font-semibold mt-1 ${isTechnical ? "text-emerald-800" : isClassic ? "text-slate-700 italic" : "text-[#4F7CFF]"}`}>
              {resumeData.targetRole}
            </p>
          )}

          {/* Contact Bar */}
          <div className={`flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 mt-2.5 ${isClassic ? "justify-center" : "justify-start"}`}>
            {contactList.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {c.icon && <c.icon className="w-3 h-3 text-slate-500" />}
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer" className="hover:text-slate-950 underline underline-offset-2">
                    {c.label}
                  </a>
                ) : (
                  <span>{c.label}</span>
                )}
                {i < contactList.length - 1 && <span className="text-slate-300 ml-1.5">•</span>}
              </span>
            ))}
          </div>
        </header>

        {/* 1. Professional Summary */}
        {(resumeData.professionalSummary || resumeData.summary) && (
          <section className="mb-5">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-1.5 pb-0.5 border-b ${primaryAccent}`}>
              Professional Summary
            </h2>
            <p className="text-slate-700 leading-normal text-justify">
              {resumeData.professionalSummary || resumeData.summary}
            </p>
          </section>
        )}

        {/* 2. Technical Skills */}
        {((isArraySkills && skills.length > 0) || (!isArraySkills && skills)) && (
          <section className="mb-5">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${primaryAccent}`}>
              Technical Skills
            </h2>

            {isArraySkills ? (
              <div className="space-y-1.5 text-xs">
                {/* Categorized layout */}
                {Object.entries(
                  skills.reduce((acc, s) => {
                    const cat = s.category || "Languages & Technologies";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(typeof s === "string" ? s : s.name);
                    return acc;
                  }, {})
                ).map(([category, skillList]) => (
                  <div key={category} className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-bold text-slate-900 capitalize w-32 shrink-0">
                      {category.replace(/_/g, " ")}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {isTechnical ? (
                        skillList.map((s, idx) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-700">{skillList.join(", ")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 text-xs text-slate-700">
                {skills.expert?.length > 0 && (
                  <p><strong className="text-slate-900">Expert:</strong> {skills.expert.join(", ")}</p>
                )}
                {skills.proficient?.length > 0 && (
                  <p><strong className="text-slate-900">Proficient:</strong> {skills.proficient.join(", ")}</p>
                )}
                {skills.developing?.length > 0 && (
                  <p><strong className="text-slate-900">Developing:</strong> {skills.developing.join(", ")}</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* 3. Work Experience & Internships */}
        {Array.isArray(resumeData.experience) && resumeData.experience.length > 0 && (
          <section className="mb-5">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${primaryAccent}`}>
              Professional Experience
            </h2>
            <div className="space-y-3.5">
              {resumeData.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-950 text-sm">{exp.title}</span>
                      <span className="text-slate-700 font-medium ml-1.5">
                        — {exp.company}{exp.location ? `, ${exp.location}` : ""}
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">
                      {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : ""}
                    </span>
                  </div>

                  {exp.description && (
                    <p className="text-xs text-slate-600 leading-normal">{exp.description}</p>
                  )}

                  {Array.isArray(exp.bulletPoints) && exp.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 leading-normal">
                      {exp.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Portfolio Projects */}
        {Array.isArray(resumeData.projects) && resumeData.projects.length > 0 && (
          <section className="mb-5">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${primaryAccent}`}>
              Portfolio Projects
            </h2>
            <div className="space-y-3.5">
              {resumeData.projects.map((proj, idx) => (
                <div key={proj.id || idx} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-950 text-sm">{proj.title}</span>
                      {Array.isArray(proj.techStack) && proj.techStack.length > 0 && (
                        <span className="text-[11px] font-mono text-[#4F7CFF] font-medium">
                          [{proj.techStack.join(", ")}]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-slate-950 underline flex items-center gap-0.5">
                          Code <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {proj.demoUrl && (
                        <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5">
                          Live Demo <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-600 leading-normal">{proj.description}</p>
                  )}

                  {Array.isArray(proj.bulletPoints) && proj.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 leading-normal">
                      {proj.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Education */}
        {Array.isArray(resumeData.education) && resumeData.education.length > 0 && (
          <section className="mb-5">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${primaryAccent}`}>
              Education
            </h2>
            <div className="space-y-2.5">
              {resumeData.education.map((edu, idx) => (
                <div key={edu.id || idx} className="text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <div>
                      <span className="font-bold text-slate-950">
                        {edu.degree || "Degree"}
                        {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                      </span>
                      <span className="text-slate-700 ml-1.5">
                        — {edu.institution}{edu.location ? `, ${edu.location}` : ""}
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {edu.startDate} {edu.endDate ? `– ${edu.endDate}` : ""}
                    </span>
                  </div>

                  {edu.gpa && (
                    <p className="text-slate-600 mt-0.5 font-medium">Cumulative GPA: {edu.gpa}</p>
                  )}

                  {Array.isArray(edu.coursework) && edu.coursework.length > 0 && (
                    <p className="text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">Coursework:</span> {edu.coursework.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Certifications & Achievements */}
        {((Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0) ||
          (Array.isArray(resumeData.achievements) && resumeData.achievements.length > 0)) && (
          <section className="mb-5">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 pb-0.5 border-b ${primaryAccent}`}>
              Certifications & Milestones
            </h2>
            <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
              {resumeData.certifications?.map((c, idx) => (
                <li key={idx}>
                  <strong className="text-slate-900">{c.name}</strong>
                  {c.issuer ? ` — ${c.issuer}` : ""}
                  {c.issueDate ? ` (${c.issueDate})` : ""}
                </li>
              ))}
              {resumeData.achievements?.map((a, idx) => (
                <li key={idx}>
                  <strong className="text-slate-900">{a.title}</strong>
                  {a.issuer ? ` (${a.issuer})` : ""}
                  {a.description ? `: ${a.description}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. Languages */}
        {Array.isArray(resumeData.languages) && resumeData.languages.length > 0 && (
          <section className="mb-2">
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-1.5 pb-0.5 border-b ${primaryAccent}`}>
              Languages
            </h2>
            <p className="text-xs text-slate-700">
              {resumeData.languages.map((l) => `${l.language} (${l.proficiency || "Fluent"})`).join("  •  ")}
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;
