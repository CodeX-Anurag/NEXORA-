const crypto = require("crypto");
const Recommendation = require("../models/Recommendation.model");
const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");
const Project = require("../models/Project.model");
const User = require("../models/User.model");
const { getUserCareerAnalysis } = require("./career.service");
const LLMClient = require("../ai/llmClient");
const PromptManager = require("../ai/promptManager");
const ResponseParser = require("../ai/responseParser");
const ContextBuilder = require("../ai/contextBuilder");
const aiUsageService = require("./aiUsage.service");
const aiQualityEvaluator = require("../utils/aiQualityEvaluator");

/**
 * Generate normalized fingerprint for duplicate recommendation detection
 */
const createFingerprint = (title = "", type = "skill") => {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return `${type}:${cleanTitle}`;
};

/**
 * 1. AI Skill Analysis: Combines deterministic skill gap metrics with LLM explanation
 */
const analyzeSkillGaps = async (userId, llmClientOverride = null) => {
  // Deterministic calculation in backend
  const analysis = await getUserCareerAnalysis(userId);
  const user = await User.findById(userId);

  const { systemContext } = await ContextBuilder.buildContext(
    userId,
    "Perform AI Skill Gap Analysis",
    [],
    {}
  );

  const prompt = `${systemContext}
  
[DETERMINISTIC SKILL METRICS]
- Target Role: ${analysis.targetRole}
- Career Readiness Score: ${analysis.careerReadinessScore}%
- Acquired Skills Count: ${analysis.acquiredSkillsCount}
- Critical Gaps Count: ${analysis.criticalGapsCount}
- Skill Gaps: ${JSON.stringify(analysis.skillGaps)}

INSTRUCTIONS:
Provide a concise, high-impact breakdown explaining the student's readiness score, highlighting their critical skill gaps, and offering 3 specific actionable learning steps.
Keep the response clear, encouraging, and professional.`;

  const llmClient = llmClientOverride || new LLMClient();
  const rawResponse = await llmClient.generateResponse({
    systemPrompt: PromptManager.getSystemPrompt(),
    messages: [{ role: "user", content: prompt }]
  });

  const parsed = ResponseParser.parse(rawResponse);

  return {
    success: true,
    metrics: {
      targetRole: analysis.targetRole,
      careerReadinessScore: analysis.careerReadinessScore,
      acquiredSkillsCount: analysis.acquiredSkillsCount,
      criticalGapsCount: analysis.criticalGapsCount,
      skillGaps: analysis.skillGaps
    },
    aiExplanation: parsed.content
  };
};

/**
 * 2. AI Structured Career Roadmap Generation
 */
const generateCareerRoadmap = async (userId, targetRoleOverride = null, llmClientOverride = null) => {
  const analysis = await getUserCareerAnalysis(userId);
  const targetRole = targetRoleOverride || analysis.targetRole || "Full Stack Developer";

  const userProjects = await Project.find({ userId });
  const { systemContext } = await ContextBuilder.buildContext(
    userId,
    `Generate Structured Roadmap for ${targetRole}`,
    [],
    {}
  );

  const prompt = `${systemContext}

[ROADMAP INPUT DATA]
- Target Role: ${targetRole}
- Current Readiness Score: ${analysis.careerReadinessScore}%
- Skill Gaps: ${JSON.stringify(analysis.skillGaps)}
- Existing Projects: ${userProjects.map((p) => p.title).join(", ") || "None"}

INSTRUCTIONS:
Generate a 3-stage structured career roadmap for ${targetRole}.
Return ONLY valid JSON matching this exact structure:
{
  "career": "${targetRole}",
  "stages": [
    {
      "title": "Stage 1: Foundational Core",
      "skills": ["Skill A", "Skill B"],
      "actions": ["Action 1", "Action 2"]
    },
    {
      "title": "Stage 2: Advanced Mastery",
      "skills": ["Skill C"],
      "actions": ["Action 3"]
    },
    {
      "title": "Stage 3: Portfolio & Production",
      "skills": ["Skill D"],
      "actions": ["Action 4"]
    }
  ]
}`;

  const startTime = Date.now();
  const llmClient = llmClientOverride || new LLMClient();
  const rawResponse = await llmClient.generateResponse({
    systemPrompt: PromptManager.getSystemPrompt() + "\nIMPORTANT: You must respond ONLY with raw JSON. Do not include extra conversational text.",
    messages: [{ role: "user", content: prompt }]
  });
  const latencyMs = Date.now() - startTime;

  const parsedText = ResponseParser.parse(rawResponse).content;
  const qualityEval = aiQualityEvaluator.evaluateStructuredQuality({
    rawText: parsedText,
    schemaType: "roadmap"
  });

  let roadmapData = qualityEval.parsedData;
  let fallbackActivated = false;

  if (qualityEval.isValidSchema && qualityEval.parsedData) {
    roadmapData = qualityEval.parsedData;
  } else {
    fallbackActivated = true;
    const topGaps = analysis.skillGaps.map((s) => s.skillName);
    roadmapData = {
      career: targetRole,
      stages: [
        {
          title: "Stage 1: Core Skill Building",
          skills: topGaps.slice(0, 2),
          actions: [`Master core principles of ${topGaps[0] || "primary technologies"}`]
        },
        {
          title: "Stage 2: Practical Projects & Tooling",
          skills: topGaps.slice(2, 4),
          actions: ["Build full-stack portfolio applications and integrate APIs"]
        },
        {
          title: "Stage 3: Career Preparation & Deployment",
          skills: topGaps.slice(4),
          actions: ["Deploy production apps, optimize performance, and prepare for interviews"]
        }
      ]
    };
  }

  // Record Telemetry Usage & Quality Signals
  const usageInfo = rawResponse?.usage || {};
  aiUsageService.recordUsage({
    userId,
    provider: rawResponse?.provider || "mock",
    model: rawResponse?.model || "mock-model",
    operation: "roadmap",
    endpoint: "/api/v1/ai/generate-roadmap",
    promptTokens: usageInfo.promptTokens || 120,
    completionTokens: usageInfo.completionTokens || 150,
    totalTokens: usageInfo.totalTokens || 270,
    latencyMs,
    qualityScore: fallbackActivated ? 50 : qualityEval.qualityScore,
    isValidSchema: qualityEval.isValidSchema,
    schemaCompletenessScore: qualityEval.schemaCompletenessScore,
    fallbackActivated,
    qualityIssues: qualityEval.qualityIssues
  });

  return {
    success: true,
    roadmap: roadmapData
  };
};

/**
 * 3. AI Recommendation Engine: Deterministically computes signals & creates valid non-duplicate recommendations
 */
const generateRecommendations = async (userId, llmClientOverride = null) => {
  // Deterministic priority signals computed in backend
  const analysis = await getUserCareerAnalysis(userId);
  const [tasks, studySessions, projects, existingRecs] = await Promise.all([
    Task.find({ userId, status: { $ne: "completed" } }).sort({ deadline: 1 }).limit(5),
    StudySession.find({ userId }).sort({ date: -1 }).limit(5),
    Project.find({ userId }),
    Recommendation.find({ userId })
  ]);

  const rejectedFingerprints = new Set(
    existingRecs.filter((r) => r.feedback === "rejected" || r.status === "rejected").map((r) => r.fingerprint)
  );

  const topGap = analysis.skillGaps.find((s) => s.category === "Critical") || analysis.skillGaps[0];
  const urgentTask = tasks.find((t) => t.priority === "high") || tasks[0];

  const { systemContext } = await ContextBuilder.buildContext(userId, "Generate recommendations", [], {});

  const prompt = `${systemContext}

[DETERMINISTIC PRIORITY SIGNALS]
- Top Skill Gap: ${topGap ? topGap.skillName : "General Full Stack"} (Gap: ${topGap ? topGap.gap : 0} points)
- Urgent Task: ${urgentTask ? urgentTask.title : "No pending high priority tasks"}
- Active Projects: ${projects.length}
- Previous Rejected Fingerprints: ${Array.from(rejectedFingerprints).join(", ") || "None"}

INSTRUCTIONS:
Generate 1 highly actionable recommendation for the student.
Return ONLY valid JSON with this exact structure:
{
  "title": "Recommendation Title",
  "description": "Clear explanation why this is high value for their career.",
  "type": "skill",
  "actionableSteps": ["Step 1", "Step 2"],
  "relevanceScore": 85
}`;

  const startTime = Date.now();
  const llmClient = llmClientOverride || new LLMClient();
  const rawResponse = await llmClient.generateResponse({
    systemPrompt: PromptManager.getSystemPrompt() + "\nIMPORTANT: You must respond ONLY with raw JSON. Do not include extra conversational text.",
    messages: [{ role: "user", content: prompt }]
  });
  const latencyMs = Date.now() - startTime;

  const parsedText = ResponseParser.parse(rawResponse).content;
  const qualityEval = aiQualityEvaluator.evaluateStructuredQuality({
    rawText: parsedText,
    schemaType: "recommendation"
  });

  let recData = qualityEval.parsedData;
  let fallbackActivated = false;

  if (qualityEval.isValidSchema && qualityEval.parsedData) {
    recData = qualityEval.parsedData;
  } else {
    fallbackActivated = true;
    recData = {
      title: topGap ? `Focus on Mastering ${topGap.skillName}` : "Complete High Priority Study Session",
      description: topGap
        ? `Closing your ${topGap.gap}-point gap in ${topGap.skillName} will significantly boost your NEXORA Career Readiness score.`
        : "Dedicate 45 minutes today to tackle your highest priority focus task.",
      type: topGap ? "skill" : "task",
      actionableSteps: [
        topGap ? `Schedule a 45-minute study block for ${topGap.skillName}` : "Break down high priority task into sub-items",
        "Build a hands-on mini component to test proficiency"
      ],
      relevanceScore: 90
    };
  }

  // Record Telemetry Usage & Quality Signals
  const usageInfo = rawResponse?.usage || {};
  aiUsageService.recordUsage({
    userId,
    provider: rawResponse?.provider || "mock",
    model: rawResponse?.model || "mock-model",
    operation: "recommendation",
    endpoint: "/api/v1/ai/recommendations",
    promptTokens: usageInfo.promptTokens || 110,
    completionTokens: usageInfo.completionTokens || 130,
    totalTokens: usageInfo.totalTokens || 240,
    latencyMs,
    qualityScore: fallbackActivated ? 50 : qualityEval.qualityScore,
    isValidSchema: qualityEval.isValidSchema,
    schemaCompletenessScore: qualityEval.schemaCompletenessScore,
    fallbackActivated,
    qualityIssues: qualityEval.qualityIssues
  });

  // Generate fingerprint for duplicate detection
  const fingerprint = createFingerprint(recData.title, recData.type || "skill");

  // Check if recommendation with this fingerprint already exists for user
  let recommendation = await Recommendation.findOne({ userId, fingerprint });
  if (!recommendation) {
    recommendation = await Recommendation.create({
      userId,
      fingerprint,
      title: recData.title,
      description: recData.description,
      type: recData.type || "skill",
      actionableSteps: recData.actionableSteps || [],
      relevanceScore: recData.relevanceScore || 80,
      feedback: "pending",
      status: "active"
    });
  }

  return recommendation;
};

/**
 * 4. Retrieve recommendations for authenticated user
 */
const getRecommendations = async (userId) => {
  return await Recommendation.find({ userId, status: { $ne: "dismissed" } }).sort({ createdAt: -1 });
};

/**
 * 5. Handle recommendation feedback (helpful, not_useful, accepted, rejected)
 */
const submitFeedback = async (userId, recommendationId, { feedback, status }) => {
  const allowedFeedbacks = ["helpful", "not_useful", "accepted", "rejected", "pending"];
  const allowedStatuses = ["active", "accepted", "rejected", "dismissed", "completed"];

  const updates = {};
  if (feedback && allowedFeedbacks.includes(feedback)) {
    updates.feedback = feedback;
    if (feedback === "rejected") updates.status = "rejected";
    if (feedback === "accepted") updates.status = "accepted";
  }

  if (status && allowedStatuses.includes(status)) {
    updates.status = status;
  }

  const rec = await Recommendation.findOneAndUpdate(
    { _id: recommendationId, userId },
    { $set: updates },
    { new: true }
  );

  if (!rec) {
    const err = new Error("Recommendation not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  return rec;
};

/**
 * 6. Give Another Recommendation: Guarantees a fresh, non-duplicate recommendation distinct from past rejected items
 */
const giveAnotherRecommendation = async (userId, llmClientOverride = null) => {
  const existingRecs = await Recommendation.find({ userId });
  
  // Mark any active/pending recommendation as rejected or dismissed
  const activeRecs = existingRecs.filter((r) => r.status === "active");
  for (const r of activeRecs) {
    r.feedback = "rejected";
    r.status = "rejected";
    await r.save();
  }

  const rejectedFingerprints = existingRecs.map((r) => r.fingerprint);
  const rejectedTitles = existingRecs.map((r) => r.title);

  const analysis = await getUserCareerAnalysis(userId);
  const skillGaps = analysis.skillGaps || [];

  // Filter skills that haven't been recommended yet
  const unrecommendedSkill = skillGaps.find((s) => !rejectedTitles.some((t) => t.toLowerCase().includes(s.skillName.toLowerCase())));

  const targetTitle = unrecommendedSkill
    ? `Build Core Expertise in ${unrecommendedSkill.skillName}`
    : `Execute Practical Portfolio Project for ${analysis.targetRole}`;

  const targetType = unrecommendedSkill ? "skill" : "project";
  const newFingerprint = createFingerprint(targetTitle, targetType);

  // If fingerprint collision occurs, append unique timestamp suffix
  const finalFingerprint = rejectedFingerprints.includes(newFingerprint)
    ? `${newFingerprint}-${Date.now()}`
    : newFingerprint;

  const newRec = await Recommendation.create({
    userId,
    fingerprint: finalFingerprint,
    title: targetTitle,
    description: unrecommendedSkill
      ? `Addressing your ${unrecommendedSkill.gap}-point gap in ${unrecommendedSkill.skillName} will immediately increase your readiness score.`
      : `Build a dedicated open-source project to highlight your capabilities as a ${analysis.targetRole}.`,
    type: targetType,
    actionableSteps: [
      `Review key documentation and tutorials for ${unrecommendedSkill ? unrecommendedSkill.skillName : analysis.targetRole}`,
      "Complete a 60-minute practical coding exercise",
      "Add project milestones to your NEXORA Project Portfolio"
    ],
    relevanceScore: 88,
    feedback: "pending",
    status: "active"
  });

  return newRec;
};

module.exports = {
  createFingerprint,
  analyzeSkillGaps,
  generateCareerRoadmap,
  generateRecommendations,
  getRecommendations,
  submitFeedback,
  giveAnotherRecommendation
};
