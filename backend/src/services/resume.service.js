const mongoose = require("mongoose");
const User = require("../models/User.model");
const UserSkill = require("../models/UserSkill.model");
const Project = require("../models/Project.model");
const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");
const ResumeProfile = require("../models/ResumeProfile.model");
const SavedResume = require("../models/SavedResume.model");
const PlatformConnection = require("../models/PlatformConnection.model");
const careerService = require("./career.service");
const LLMClient = require("../ai/llmClient");
const { parseLlmJson, compareProfileWithJob } = require("./jobResearch.service");
const { generateResumeDocx, generateResumePdf } = require("./resumeExport.service");

/**
 * 1. Retrieves or pre-populates persistent Resume Profile for authenticated user
 */
const getResumeProfile = async (userId) => {
  let profile = await ResumeProfile.findOne({ userId });

  // If profile doesn't exist yet, synthesize an initial draft from authenticated NEXORA data
  if (!profile) {
    const [user, careerAnalysis, userSkills, projects, completedTasks] = await Promise.all([
      User.findById(userId).lean(),
      careerService.getUserCareerAnalysis(userId).catch(() => null),
      UserSkill.find({ userId }).sort({ currentLevel: -1 }).limit(50).lean(),
      Project.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      Task.find({ userId, status: "completed" }).sort({ updatedAt: -1 }).limit(10).lean()
    ]);

    if (!user) {
      const err = new Error("Authenticated user profile not found.");
      err.statusCode = 404;
      throw err;
    }

    const targetRole = careerAnalysis?.targetRole || user.careerGoal?.targetRole || "Software Engineer";

    const mappedSkills = userSkills.map((s) => ({
      name: s.skillName,
      category: "languages",
      level: s.currentLevel || 75,
      confirmed: true
    }));

    const mappedProjects = projects.map((p) => ({
      title: p.title,
      description: p.description || "",
      techStack: p.techStack || [],
      bulletPoints: p.description ? [p.description] : [],
      githubUrl: p.githubUrl || "",
      demoUrl: p.demoUrl || ""
    }));

    const mappedAchievements = completedTasks.map((t) => ({
      title: t.title,
      issuer: t.roadmapStage || "NEXORA Milestone",
      description: t.description || ""
    }));

    const eduInfo = user.education || {};
    const initialEducation = eduInfo.institution
      ? [
          {
            degree: eduInfo.degree || "Bachelor of Technology",
            fieldOfStudy: "Computer Science",
            institution: eduInfo.institution,
            location: "",
            startDate: "",
            endDate: eduInfo.year ? String(eduInfo.year) : "Present",
            current: !eduInfo.year,
            coursework: []
          }
        ]
      : [];

    profile = new ResumeProfile({
      userId,
      personalInfo: {
        fullName: user.name || "",
        email: user.email || "",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        portfolio: "",
        website: ""
      },
      targetRole,
      professionalSummary: `Dedicated ${targetRole} with strong grounding in modern software development, proven by ${mappedProjects.length} portfolio projects and ${mappedSkills.length} rated technical competencies.`,
      education: initialEducation,
      skills: mappedSkills,
      projects: mappedProjects,
      experience: [],
      certifications: [],
      achievements: mappedAchievements,
      coursework: [],
      responsibilities: [],
      languages: [{ language: "English", proficiency: "Professional" }],
      lastConfirmedAt: null
    });

    await profile.save();
  }

  const completion = profile.calculateCompletion();

  return {
    success: true,
    profile,
    completion,
    hasConfirmedData: !!profile.lastConfirmedAt
  };
};

/**
 * 2. Persistently saves confirmed Resume Profile
 */
const saveResumeProfile = async (userId, updatePayload) => {
  let profile = await ResumeProfile.findOne({ userId });

  if (!profile) {
    profile = new ResumeProfile({ userId });
  }

  // Update allowed profile fields
  const allowedFields = [
    "personalInfo",
    "targetRole",
    "professionalSummary",
    "education",
    "skills",
    "projects",
    "experience",
    "certifications",
    "achievements",
    "coursework",
    "responsibilities",
    "languages"
  ];

  allowedFields.forEach((field) => {
    if (updatePayload[field] !== undefined) {
      profile[field] = updatePayload[field];
    }
  });

  profile.lastConfirmedAt = new Date();
  await profile.save();

  const completion = profile.calculateCompletion();

  return {
    success: true,
    message: "Resume profile saved persistently.",
    profile,
    completion
  };
};

/**
 * 3. Gemini-Powered Tailored Resume Generation
 */
const generateTailoredResume = async (userId, options = {}) => {
  const {
    template = "modern",
    targetRole = "",
    targetCompany = "",
    jobDescription = null,
    profileOverride = null,
    preferredLength = "1_page"
  } = options;

  // Retrieve confirmed profile
  let profileData = profileOverride;
  if (!profileData) {
    const profileDoc = await ResumeProfile.findOne({ userId }).lean();
    profileData = profileDoc;
  }

  if (!profileData || !profileData.personalInfo?.fullName) {
    const err = new Error(
      "Your resume profile is incomplete. Please confirm your personal details and education before generating a resume."
    );
    err.statusCode = 400;
    err.requiresOnboarding = true;
    throw err;
  }

  const effectiveRole = targetRole || profileData.targetRole || "Software Engineer";

  // Merge verified platform achievements and selected GitHub projects if connected
  let platformConnections = [];
  if (mongoose.connection.readyState === 1) {
    platformConnections = await PlatformConnection.find({
      userId,
      connectionStatus: "connected"
    }).lean();
  }

  const factualProjects = [...(profileData.projects || [])];
  const factualAchievements = [...(profileData.achievements || [])];

  platformConnections.forEach((conn) => {
    if (conn.platform === "github" && Array.isArray(conn.selectedItems)) {
      conn.selectedItems.forEach((repo) => {
        if (
          repo.selectedForResume !== false &&
          !factualProjects.some((p) => (p.title || "").toLowerCase() === (repo.title || "").toLowerCase())
        ) {
          factualProjects.push({
            title: repo.title,
            description: repo.description,
            techStack: repo.techStack || [],
            bulletPoints: repo.bulletPoints?.length
              ? repo.bulletPoints
              : [`Architected repository with ${repo.stars} GitHub stars and ${repo.forks} forks.`],
            githubUrl: repo.url,
            demoUrl: ""
          });
        }
      });
    }

    if (conn.platform === "leetcode" && conn.importedData?.totalSolved) {
      const leetText = `Solved ${conn.importedData.totalSolved} algorithmic problems on LeetCode (${conn.importedData.medium || 0} Medium, ${conn.importedData.hard || 0} Hard)${conn.importedData.contestRating ? ` with contest rating ${conn.importedData.contestRating}` : ""}.`;
      if (!factualAchievements.some((a) => (a.title || "").includes("LeetCode"))) {
        factualAchievements.push({
          title: "LeetCode Problem Solving",
          issuer: "LeetCode",
          description: leetText
        });
      }
    }

    if (conn.platform === "codeforces" && conn.importedData?.rating) {
      const cfText = `Codeforces Rating ${conn.importedData.rating} (${conn.importedData.rank}) with peak rating ${conn.importedData.maxRating} across ${conn.importedData.contestCount} contests.`;
      if (!factualAchievements.some((a) => (a.title || "").includes("Codeforces"))) {
        factualAchievements.push({
          title: `Codeforces Rating ${conn.importedData.rating}`,
          issuer: "Codeforces",
          description: cfText
        });
      }
    }
  });

  // Sanitize and format factual data for the prompt
  const factualProfileJson = JSON.stringify(
    {
      personalInfo: profileData.personalInfo,
      targetRole: effectiveRole,
      professionalSummary: profileData.professionalSummary,
      education: profileData.education || [],
      skills: profileData.skills || [],
      projects: factualProjects,
      experience: profileData.experience || [],
      certifications: profileData.certifications || [],
      achievements: factualAchievements,
      responsibilities: profileData.responsibilities || [],
      languages: profileData.languages || []
    },
    null,
    2
  );

  const jdContext = jobDescription
    ? `TARGET JOB DESCRIPTION & REQUIREMENTS:
Role: ${jobDescription.jobTitle || effectiveRole}
Company: ${targetCompany || jobDescription.company || "Target Company"}
Required Skills: ${(jobDescription.requiredSkills || []).join(", ")}
Preferred Skills: ${(jobDescription.preferredSkills || []).join(", ")}
Key Responsibilities: ${(jobDescription.responsibilities || []).slice(0, 5).join(" | ")}`
    : `TARGET ROLE: ${effectiveRole} ${targetCompany ? `at ${targetCompany}` : ""}`;

  const prompt = `You are the NEXORA Resume Intelligence Engine.
Your task is to generate a professional, ATS-optimized, polished resume grounded strictly in the candidate's factual details.

${jdContext}

CANDIDATE'S CONFIRMED FACTS:
${factualProfileJson}

ABSOLUTE NON-HALLUCINATION RULES:
1. NEVER invent employers, job titles, companies, dates, degrees, universities, GPA, or certifications.
2. NEVER invent fake measurable metrics (e.g. do not invent "increased revenue by 45%" unless explicitly in candidate facts).
3. You MAY refine grammar, action verbs, clarity, and phrasing to highlight relevance to the target role.
4. For projects and experience, craft 2-4 impactful bullet points per item using strong action verbs (e.g. Architected, Engineered, Developed, Deployed, Streamlined) reflecting the candidate's actual work.
5. If target job skills match candidate skills, highlight them prominently. DO NOT add skills the candidate does not have.
6. The candidate preferred resume length is: ${preferredLength === "2_page" ? "Comprehensive (up to 2 pages)" : "Concise (1 page)"}.
7. Return strictly valid JSON matching the exact schema below, with no markdown code blocks and no conversational text.

SCHEMA:
{
  "personalInfo": {
    "fullName": "${profileData.personalInfo.fullName}",
    "email": "${profileData.personalInfo.email}",
    "phone": "${profileData.personalInfo.phone || ""}",
    "location": "${profileData.personalInfo.location || ""}",
    "linkedin": "${profileData.personalInfo.linkedin || ""}",
    "github": "${profileData.personalInfo.github || ""}",
    "portfolio": "${profileData.personalInfo.portfolio || ""}"
  },
  "targetRole": "${effectiveRole}",
  "professionalSummary": "A concise 2-3 sentence executive bio tailored to the target role, grounded strictly in user facts.",
  "skills": [
    { "name": "Skill Name", "category": "languages", "level": 85 }
  ],
  "experience": [
    {
      "title": "Role Title",
      "company": "Company",
      "location": "Location",
      "startDate": "Date",
      "endDate": "Date",
      "bulletPoints": ["Action verb + task + technical outcome"]
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Short overview",
      "techStack": ["Tech1", "Tech2"],
      "bulletPoints": ["Action verb + technical architecture + outcome"],
      "githubUrl": "URL if present in facts",
      "demoUrl": "URL if present in facts"
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "fieldOfStudy": "Field",
      "institution": "Institution",
      "location": "Location",
      "startDate": "Start",
      "endDate": "End",
      "gpa": "GPA if present",
      "coursework": ["Course 1"]
    }
  ],
  "certifications": [
    { "name": "Cert", "issuer": "Issuer", "issueDate": "Date" }
  ],
  "achievements": [
    { "title": "Achievement", "issuer": "Issuer", "description": "Description" }
  ],
  "responsibilities": [
    { "role": "Role", "organization": "Org", "bulletPoints": ["Bullet"] }
  ],
  "languages": [
    { "language": "English", "proficiency": "Professional" }
  ]
}`;

  const llm = new LLMClient();
  let generatedData = null;

  try {
    const aiRes = await llm.generateResponse({
      systemPrompt:
        "You are an expert ATS Resume Generator. Generate strictly factual, professionally phrased resume JSON. Do not hallucinate.",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      maxOutputTokens: 3072
    });

    generatedData = parseLlmJson(aiRes.content);
  } catch (err) {
    console.warn("[ResumeService] LLM generation error:", err.message);
  }

  // Robust fallback: if LLM fails or produces malformed JSON, assemble a clean deterministic resume from confirmed facts
  if (!generatedData || !generatedData.personalInfo) {
    generatedData = {
      personalInfo: {
        fullName: profileData.personalInfo.fullName,
        email: profileData.personalInfo.email,
        phone: profileData.personalInfo.phone || "",
        location: profileData.personalInfo.location || "",
        linkedin: profileData.personalInfo.linkedin || "",
        github: profileData.personalInfo.github || "",
        portfolio: profileData.personalInfo.portfolio || ""
      },
      targetRole: effectiveRole,
      professionalSummary:
        profileData.professionalSummary ||
        `Motivated student aspiring for ${effectiveRole} role, demonstrating strong technical execution and continuous learning.`,
      skills: profileData.skills || [],
      experience: (profileData.experience || []).map((exp) => ({
        ...exp,
        bulletPoints: exp.bulletPoints?.length ? exp.bulletPoints : [exp.description].filter(Boolean)
      })),
      projects: (profileData.projects || []).map((proj) => ({
        ...proj,
        bulletPoints: proj.bulletPoints?.length ? proj.bulletPoints : [proj.description].filter(Boolean)
      })),
      education: profileData.education || [],
      certifications: profileData.certifications || [],
      achievements: profileData.achievements || [],
      responsibilities: profileData.responsibilities || [],
      languages: profileData.languages || [{ language: "English", proficiency: "Professional" }]
    };
  }

  // Calculate job match if job description was supplied
  let matchAnalysis = null;
  if (jobDescription) {
    matchAnalysis = compareProfileWithJob(profileData, jobDescription);
  }

  return {
    success: true,
    resumeData: generatedData,
    template,
    matchAnalysis
  };
};

/**
 * 4. AI Section Refinement (e.g. polish summary, bullet points)
 */
const improveSectionAi = async (userId, payload) => {
  const { sectionType, currentContent, context = {}, targetRole = "Software Engineer" } = payload;

  let prompt = "";
  if (sectionType === "summary") {
    prompt = `You are a career strategist. Refine this resume summary for a candidate targeting "${targetRole}".
Current summary: "${currentContent || ""}"
Context details: ${JSON.stringify(context)}
STRICT RULE: Do not invent any work experience, companies, or degrees not mentioned in the context.
Return ONLY the polished 2-3 sentence summary text, with no quotes, no markdown, and no extra words.`;
  } else if (sectionType === "bulletPoints") {
    prompt = `You are an expert resume writer. Transform the following project/work description into 2-3 ATS-optimized bullet points starting with strong action verbs.
Input text: "${currentContent || ""}"
Context (title/tech): ${JSON.stringify(context)}
STRICT RULE: Keep strictly within the bounds of the user's factual work. Do not fabricate metrics.
Return ONLY valid JSON array of strings, e.g. ["Action verb...", "Action verb..."], no markdown.`;
  } else {
    const err = new Error("Unsupported section type for AI assist.");
    err.statusCode = 400;
    throw err;
  }

  const llm = new LLMClient();
  const aiRes = await llm.generateResponse({
    systemPrompt: "You are an ATS resume editor. Return strictly the requested content without surrounding text.",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxOutputTokens: 1024
  });

  let result = aiRes.content.trim();
  if (sectionType === "bulletPoints") {
    const parsed = parseLlmJson(result);
    result = Array.isArray(parsed) ? parsed : [result];
  }

  return {
    success: true,
    sectionType,
    result
  };
};

/**
 * 5. Saved Resumes Management (CRUD)
 */
const listSavedResumes = async (userId) => {
  const resumes = await SavedResume.find({ userId }).sort({ updatedAt: -1 }).lean();
  return { success: true, count: resumes.length, resumes };
};

const getSavedResume = async (userId, resumeId) => {
  const resume = await SavedResume.findOne({ _id: resumeId, userId }).lean();
  if (!resume) {
    const err = new Error("Saved resume not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  return { success: true, resume };
};

const createSavedResume = async (userId, payload) => {
  const { title, targetRole, targetCompany, template, resumeData, jobDescription, matchAnalysis, isPrimary } = payload;

  if (!resumeData) {
    const err = new Error("Resume data is required to save.");
    err.statusCode = 400;
    throw err;
  }

  const saved = new SavedResume({
    userId,
    title: title || `${resumeData?.personalInfo?.fullName || "My"} Resume - ${new Date().toLocaleDateString()}`,
    targetRole: targetRole || resumeData.targetRole || "Software Engineer",
    targetCompany: targetCompany || "",
    template: template || "modern",
    resumeData,
    jobDescription: jobDescription || null,
    matchAnalysis: matchAnalysis || null,
    isPrimary: !!isPrimary
  });

  await saved.save();

  return { success: true, message: "Resume saved to your NEXORA account.", resume: saved };
};

const updateSavedResume = async (userId, resumeId, payload) => {
  const resume = await SavedResume.findOne({ _id: resumeId, userId });
  if (!resume) {
    const err = new Error("Saved resume not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  const fields = ["title", "targetRole", "targetCompany", "template", "resumeData", "jobDescription", "matchAnalysis", "isPrimary"];
  fields.forEach((f) => {
    if (payload[f] !== undefined) resume[f] = payload[f];
  });

  await resume.save();
  return { success: true, message: "Resume updated successfully.", resume };
};

const deleteSavedResume = async (userId, resumeId) => {
  const result = await SavedResume.findOneAndDelete({ _id: resumeId, userId });
  if (!result) {
    const err = new Error("Saved resume not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  return { success: true, message: "Resume deleted successfully." };
};

/**
 * 6. Export Handlers (PDF & DOCX)
 */
const exportResumeDocx = async (resumeData, template = "modern") => {
  return await generateResumeDocx(resumeData, template);
};

const exportResumePdf = async (resumeData, template = "modern") => {
  return await generateResumePdf(resumeData, template);
};

/**
 * 7. Legacy Methods (Preserved for backwards compatibility)
 */
const generateResumeData = async (userId) => {
  const [user, careerAnalysis, userSkills, projects, completedTasks, studySessions] = await Promise.all([
    User.findById(userId).lean(),
    careerService.getUserCareerAnalysis(userId).catch(() => null),
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

  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const expertSkills = userSkills.filter((s) => s.currentLevel >= 80).map((s) => `${s.skillName} (${s.currentLevel}/100)`);
  const proficientSkills = userSkills.filter((s) => s.currentLevel >= 50 && s.currentLevel < 80).map((s) => `${s.skillName} (${s.currentLevel}/100)`);
  const developingSkills = userSkills.filter((s) => s.currentLevel < 50).map((s) => `${s.skillName} (${s.currentLevel}/100)`);

  const targetRole = careerAnalysis?.targetRole || user.careerGoal?.targetRole || "Full Stack Developer";
  const careerReadinessScore = careerAnalysis?.careerReadinessScore || 0;

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

const generateResumeMarkdown = async (userId) => {
  const data = await generateResumeData(userId);
  const lines = [];

  lines.push(`# ${data.personalInfo.name.toUpperCase()}`);
  lines.push(`**Target Role**: ${data.targetRole} | **Career Readiness Score**: ${data.careerReadinessScore}%`);
  lines.push(`**Email**: ${data.personalInfo.email}`);
  if (data.personalInfo.education?.institution) {
    lines.push(`**Education**: ${data.personalInfo.education.degree || "Degree"} — ${data.personalInfo.education.institution} (${data.personalInfo.education.year || "Present"})`);
  }
  lines.push("");

  lines.push("## PROFESSIONAL SUMMARY");
  lines.push(data.summary);
  lines.push("");

  lines.push("## TECHNICAL SKILLS");
  if (data.skills.expert.length > 0) lines.push(`- **Expert Competency (>= 80/100)**: ${data.skills.expert.join(", ")}`);
  if (data.skills.proficient.length > 0) lines.push(`- **Proficient (>= 50/100)**: ${data.skills.proficient.join(", ")}`);
  if (data.skills.developing.length > 0) lines.push(`- **Developing (< 50/100)**: ${data.skills.developing.join(", ")}`);
  lines.push("");

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

  return lines.join("\n");
};

const generateAiSummary = async (userId) => {
  const data = await generateResumeData(userId);
  const prompt = `Synthesize a concise 2-3 sentence executive bio for student "${data.personalInfo.name}" pursuing target role "${data.targetRole}". Verified Skills: ${data.skills.expert.concat(data.skills.proficient).join(", ") || "General"}. Projects: ${data.projects.map((p) => p.title).join(", ") || "None"}. Do not hallucinate external work experience.`;

  try {
    const llm = new LLMClient();
    const aiRes = await llm.generateResponse({
      systemPrompt: "You are a concise executive biographer.",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });
    return { success: true, summary: aiRes.content.trim() || data.summary };
  } catch {
    return { success: true, summary: data.summary };
  }
};

module.exports = {
  getResumeProfile,
  saveResumeProfile,
  generateTailoredResume,
  improveSectionAi,
  listSavedResumes,
  getSavedResume,
  createSavedResume,
  updateSavedResume,
  deleteSavedResume,
  exportResumeDocx,
  exportResumePdf,
  generateResumeData,
  generateResumeMarkdown,
  generateAiSummary
};
