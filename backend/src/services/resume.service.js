const User = require("../models/User.model");
const UserSkill = require("../models/UserSkill.model");
const Project = require("../models/Project.model");
const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");
const careerService = require("./career.service");
const aiService = require("./ai.service");

/**
 * Synthesizes authenticated student data into a structured Resume JSON schema
 */
const generateResumeData = async (userId) => {
  const [user, careerAnalysis, userSkills, projects, completedTasks, studySessions] = await Promise.all([
    User.findById(userId).lean(),
    careerService.getUserCareerAnalysis(userId),
    UserSkill.find({ userId }).sort({ currentLevel: -1 }).limit(50).lean(),
    Project.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
    Task.find({ userId, status: "completed" }).sort({ updatedAt: -1 }).limit(10).lean(),
    StudySession.find({ userId }).lean()
  ]);

  if (!user) {
    const err = new Error("User profile not found.");
    err.statusCode = 404;
    throw err;
  }

  // Calculate Study Metrics
  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // Categorize Skills by Verified Rating
  const expertSkills = userSkills.filter((s) => s.currentLevel >= 80).map((s) => `${s.skillName} (${s.currentLevel}/100)`);
  const proficientSkills = userSkills.filter((s) => s.currentLevel >= 50 && s.currentLevel < 80).map((s) => `${s.skillName} (${s.currentLevel}/100)`);
  const developingSkills = userSkills.filter((s) => s.currentLevel < 50).map((s) => `${s.skillName} (${s.currentLevel}/100)`);

  // Target Role & Readiness
  const targetRole = careerAnalysis?.targetRole || "Full Stack Developer";
  const careerReadinessScore = careerAnalysis?.careerReadinessScore || 0;

  // Professional Summary (Default Deterministic)
  const defaultSummary = `Passionate student specializing in ${targetRole} with a verified NEXORA Career Readiness Score of ${careerReadinessScore}%. Demonstrates expertise through ${userSkills.length} rated technical skills, ${projects.length} portfolio projects, and ${totalStudyHours} hours of dedicated technical study.`;

  return {
    personalInfo: {
      name: user.name,
      email: user.email,
      education: user.education || { degree: "", institution: "", year: null }
    },
    targetRole,
    careerReadinessScore,
    summary: defaultSummary,
    skills: {
      expert: expertSkills,
      proficient: proficientSkills,
      developing: developingSkills,
      allRated: userSkills.map((s) => ({ skillName: s.skillName, level: s.currentLevel }))
    },
    projects: projects.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      techStack: p.techStack || [],
      status: p.status,
      githubUrl: p.githubUrl || "",
      demoUrl: p.demoUrl || ""
    })),
    achievements: completedTasks.map((t) => ({
      title: t.title,
      description: t.description,
      source: t.source || "manual",
      roadmapRole: t.roadmapRole || "",
      roadmapStage: t.roadmapStage || ""
    })),
    academics: {
      totalStudyHours,
      totalStudySessions: studySessions.length,
      acquiredSkillsCount: careerAnalysis?.acquiredSkillsCount || 0
    }
  };
};

/**
 * Converts synthesized resume data into clean GFM Markdown format
 */
const generateResumeMarkdown = async (userId) => {
  const data = await generateResumeData(userId);

  const lines = [];

  // Header
  lines.push(`# ${data.personalInfo.name.toUpperCase()}`);
  lines.push(`**Target Role**: ${data.targetRole} | **Career Readiness Score**: ${data.careerReadinessScore}%`);
  lines.push(`**Email**: ${data.personalInfo.email}`);
  if (data.personalInfo.education?.institution) {
    lines.push(`**Education**: ${data.personalInfo.education.degree || "Degree"} — ${data.personalInfo.education.institution} (${data.personalInfo.education.year || "Present"})`);
  }
  lines.push("");

  // Executive Summary
  lines.push("## PROFESSIONAL SUMMARY");
  lines.push(data.summary);
  lines.push("");

  // Technical Skills
  lines.push("## TECHNICAL SKILLS");
  if (data.skills.expert.length > 0) {
    lines.push(`- **Expert Competency ($\ge 80/100$)**: ${data.skills.expert.join(", ")}`);
  }
  if (data.skills.proficient.length > 0) {
    lines.push(`- **Proficient ($\ge 50/100$)**: ${data.skills.proficient.join(", ")}`);
  }
  if (data.skills.developing.length > 0) {
    lines.push(`- **Developing ($< 50/100$)**: ${data.skills.developing.join(", ")}`);
  }
  if (data.skills.expert.length === 0 && data.skills.proficient.length === 0 && data.skills.developing.length === 0) {
    lines.push("- No rated technical skills recorded yet.");
  }
  lines.push("");

  // Portfolio Projects
  lines.push("## PORTFOLIO PROJECTS");
  if (data.projects.length === 0) {
    lines.push("*No portfolio projects added yet.*");
  } else {
    data.projects.forEach((p) => {
      lines.push(`### ${p.title} \`[${p.status.toUpperCase()}]\``);
      if (p.description) lines.push(p.description);
      if (p.techStack.length > 0) lines.push(`**Tech Stack**: ${p.techStack.join(", ")}`);
      const links = [];
      if (p.githubUrl) links.push(`[GitHub Repository](${p.githubUrl})`);
      if (p.demoUrl) links.push(`[Live Demo](${p.demoUrl})`);
      if (links.length > 0) lines.push(`**Links**: ${links.join(" | ")}`);
      lines.push("");
    });
  }

  // Key Achievements & Completed Milestones
  lines.push("## KEY ACHIEVEMENTS & COMPLETED MILESTONES");
  if (data.achievements.length === 0) {
    lines.push("*No completed milestone tasks recorded yet.*");
  } else {
    data.achievements.forEach((a) => {
      lines.push(`- **${a.title}**${a.roadmapStage ? ` *(${a.roadmapStage})*` : ""}`);
      if (a.description) lines.push(`  ${a.description}`);
    });
  }
  lines.push("");

  // Academic Engagement
  lines.push("## ACADEMIC ENGAGEMENT & LEARNING VELOCITY");
  lines.push(`- **Total Technical Study Hours**: ${data.academics.totalStudyHours} hrs across ${data.academics.totalStudySessions} study sessions.`);
  lines.push(`- **Target Role Benchmark Skills Acquired**: ${data.academics.acquiredSkillsCount} strong skills.`);
  lines.push("");

  return lines.join("\n");
};

/**
 * AI-Enhanced Professional Summary synthesis
 */
const generateAiSummary = async (userId) => {
  const data = await generateResumeData(userId);

  const prompt = `Synthesize a concise 2-3 sentence executive bio for student "${data.personalInfo.name}" pursuing target role "${data.targetRole}". Verified Skills: ${data.skills.expert.concat(data.skills.proficient).join(", ") || "General"}. Projects: ${data.projects.map((p) => p.title).join(", ") || "None"}. Do not hallucinate external work experience.`;

  try {
    const aiRes = await aiService.generateChatResponse(userId, prompt);
    const text = aiRes?.message?.content || data.summary;
    return { success: true, summary: text };
  } catch {
    return { success: true, summary: data.summary };
  }
};

module.exports = {
  generateResumeData,
  generateResumeMarkdown,
  generateAiSummary
};
