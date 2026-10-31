const VivaSession = require("../models/VivaSession.model");
const Task = require("../models/Task.model");
const LLMClient = require("../ai/llmClient");

/**
 * Cleanly extracts and parses JSON from LLM text responses
 */
const safeParseJSON = (text, fallback = {}) => {
  if (!text) return fallback;
  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    // Attempt regex extraction of JSON object
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
};

/**
 * Calculates letter grade based on 0-10 score
 */
const calculateGrade = (score) => {
  if (score >= 9) return "A+";
  if (score >= 8) return "A";
  if (score >= 7) return "B+";
  if (score >= 6) return "B";
  if (score >= 5) return "C";
  return "Needs Revision";
};

class VivaService {
  /**
   * Initializes a new Socratic Viva Exam and generates Question 1
   */
  static async startSession(userId, { topic, difficulty = "Intermediate", maxRounds = 5 }) {
    if (!topic || !topic.trim()) {
      const err = new Error("Viva topic is required.");
      err.statusCode = 400;
      throw err;
    }

    const cleanTopic = topic.trim();
    const cleanDiff = ["Beginner", "Intermediate", "Advanced"].includes(difficulty)
      ? difficulty
      : "Intermediate";
    const totalRounds = Math.min(Math.max(parseInt(maxRounds, 10) || 5, 3), 10);

    const prompt = [
      `You are an elite, fair, and encouraging technical examiner conducting an oral Socratic viva on "${cleanTopic}" (${cleanDiff} level).`,
      "",
      "TASK: Generate Question 1 for this oral technical viva.",
      "GUIDELINES:",
      "- The question must be conceptual, practical, and suitable for an oral explanation.",
      "- Focus on core principles, trade-offs, or real-world problem solving.",
      "- Keep the question direct, clear, and between 1-2 sentences.",
      "",
      "Respond strictly with a JSON object in this format:",
      JSON.stringify({
        question: `Why is ${cleanTopic} important, and what core problem does it solve in modern applications?`
      })
    ].join("\n");

    const llmClient = new LLMClient();
    let questionText = `Can you explain the foundational concept of ${cleanTopic} and how you would use it in a project?`;

    try {
      const res = await llmClient.generateResponse({
        systemPrompt: "You are a professional technical viva examiner. Return JSON only.",
        messages: [{ role: "user", content: prompt }]
      });
      const parsed = safeParseJSON(res?.content);
      if (parsed?.question && parsed.question.trim()) {
        questionText = parsed.question.trim();
      }
    } catch (llmErr) {
      console.warn(`[VivaService] Using fallback initial question: ${llmErr.message}`);
    }

    const session = await VivaSession.create({
      userId,
      topic: cleanTopic,
      difficulty: cleanDiff,
      maxRounds: totalRounds,
      currentRound: 1,
      rounds: [
        {
          roundNumber: 1,
          question: questionText
        }
      ]
    });

    return session;
  }

  /**
   * Evaluates student's oral/typed answer, provides detailed score & feedback,
   * and generates the next Socratic follow-up question or final summary.
   */
  static async submitAnswer(userId, sessionId, { answer }) {
    const session = await VivaSession.findOne({ _id: sessionId, userId });
    if (!session) {
      const err = new Error("Viva session not found or access denied.");
      err.statusCode = 404;
      throw err;
    }

    if (session.status !== "in_progress") {
      const err = new Error("This viva session has already been completed.");
      err.statusCode = 400;
      throw err;
    }

    const studentAnswer = (answer || "").trim() || "I am not sure about this concept.";
    const currentRoundIdx = session.currentRound - 1;
    const currentRound = session.rounds[currentRoundIdx];

    if (!currentRound) {
      const err = new Error("Active viva round not found.");
      err.statusCode = 400;
      throw err;
    }

    const isFinalRound = session.currentRound >= session.maxRounds;

    const evaluationPrompt = [
      `You are an expert technical viva examiner conducting an oral exam on "${session.topic}" (${session.difficulty} level).`,
      "",
      `EXAMINER QUESTION: "${currentRound.question}"`,
      `STUDENT ORAL ANSWER: "${studentAnswer}"`,
      `ROUND NUMBER: ${session.currentRound} of ${session.maxRounds}`,
      `IS FINAL ROUND: ${isFinalRound}`,
      "",
      "EVALUATION CRITERIA:",
      "1. Score from 1 to 10 based on technical accuracy, depth, and clarity.",
      "2. Feedback: 2-3 concise, encouraging, direct sentences explaining what was correct and what was missing.",
      "3. Strengths: 1-2 specific concepts the student explained well.",
      "4. Improvements: 1-2 points or nuances the student missed.",
      "5. KeyTakeaway: The ideal 1-sentence model answer.",
      isFinalRound
        ? "6. SummaryReport: overallFeedback, strengthsSummary (3 bullets), recommendedTopics (3-4 study topics to master), readinessAssessment."
        : "6. NextQuestion: A Socratic follow-up question that builds directly on the student's answer or tests a deeper related nuance.",
      "",
      "Respond strictly with valid JSON conforming to this schema:",
      JSON.stringify({
        score: 8,
        feedback: "Solid understanding of the primary concept. You explained the main mechanism clearly.",
        strengths: ["Clear definition of the core architecture"],
        improvements: ["Could mention edge case handling and memory trade-offs"],
        keyTakeaway: "The ideal answer highlights both execution speed and memory bounds.",
        ...(isFinalRound
          ? {
              summaryReport: {
                overallFeedback: "Strong performance demonstrating good fundamental understanding.",
                strengthsSummary: ["Concept clarity", "Practical intuition"],
                recommendedTopics: [`Advanced ${session.topic} patterns`, "Performance optimization"],
                readinessAssessment: "Ready for junior-to-mid technical interview rounds."
              }
            }
          : {
              nextQuestion: `Building on your point, how does ${session.topic} handle failure recovery or concurrency?`
            })
      })
    ].join("\n");

    const llmClient = new LLMClient();
    let evaluationData = {
      score: 7,
      feedback: "Good attempt! You demonstrated reasonable understanding of the subject.",
      strengths: ["Understood the baseline concept"],
      improvements: ["Could provide deeper technical detail"],
      keyTakeaway: "A comprehensive answer covers both functionality and trade-offs."
    };

    try {
      const res = await llmClient.generateResponse({
        systemPrompt: "You are a precise technical viva examiner. Return JSON only.",
        messages: [{ role: "user", content: evaluationPrompt }]
      });
      const parsed = safeParseJSON(res?.content);
      if (parsed && typeof parsed.score === "number") {
        evaluationData = {
          score: Math.min(Math.max(parsed.score, 1), 10),
          feedback: parsed.feedback || evaluationData.feedback,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : evaluationData.strengths,
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : evaluationData.improvements,
          keyTakeaway: parsed.keyTakeaway || evaluationData.keyTakeaway,
          nextQuestion: parsed.nextQuestion,
          summaryReport: parsed.summaryReport
        };
      }
    } catch (llmErr) {
      console.warn(`[VivaService] Using fallback evaluation: ${llmErr.message}`);
    }

    // Update current round in session
    currentRound.studentAnswer = studentAnswer;
    currentRound.score = evaluationData.score;
    currentRound.feedback = evaluationData.feedback;
    currentRound.strengths = evaluationData.strengths;
    currentRound.improvements = evaluationData.improvements;
    currentRound.keyTakeaway = evaluationData.keyTakeaway;

    // Recalculate average score
    const completedScores = session.rounds.map((r) => r.score).filter((s) => typeof s === "number");
    const avg = completedScores.reduce((a, b) => a + b, 0) / completedScores.length;
    session.averageScore = parseFloat(avg.toFixed(1));

    if (isFinalRound) {
      session.status = "completed";
      const finalReport = evaluationData.summaryReport || {};
      session.summaryReport = {
        overallGrade: calculateGrade(session.averageScore),
        overallFeedback:
          finalReport.overallFeedback ||
          `You completed all ${session.maxRounds} rounds of the Socratic Viva on ${session.topic} with an average score of ${session.averageScore}/10.`,
        strengthsSummary: finalReport.strengthsSummary || [
          `Solid grasp of foundational ${session.topic} principles`,
          "Good communicative problem solving"
        ],
        recommendedTopics: finalReport.recommendedTopics || [
          `${session.topic} Best Practices`,
          "Architecture Trade-offs & Deep Dive"
        ],
        readinessAssessment:
          finalReport.readinessAssessment ||
          (session.averageScore >= 8 ? "Interview Ready" : "Review Recommended")
      };
    } else {
      const nextQ =
        evaluationData.nextQuestion ||
        `Next, how does ${session.topic} behave in a high-concurrency production scenario?`;
      session.currentRound += 1;
      session.rounds.push({
        roundNumber: session.currentRound,
        question: nextQ
      });
    }

    await session.save();

    return {
      session,
      evaluation: {
        roundNumber: currentRound.roundNumber,
        score: evaluationData.score,
        feedback: evaluationData.feedback,
        strengths: evaluationData.strengths,
        improvements: evaluationData.improvements,
        keyTakeaway: evaluationData.keyTakeaway
      },
      isCompleted: isFinalRound,
      nextQuestion: isFinalRound ? null : session.rounds[session.currentRound - 1]?.question,
      summaryReport: isFinalRound ? session.summaryReport : null
    };
  }

  /**
   * Retrieves past viva sessions for student
   */
  static async getHistory(userId) {
    return await VivaSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("topic difficulty status currentRound maxRounds averageScore summaryReport.overallGrade createdAt");
  }

  /**
   * Retrieves full single viva session
   */
  static async getSessionById(userId, sessionId) {
    const session = await VivaSession.findOne({ _id: sessionId, userId });
    if (!session) {
      const err = new Error("Viva session not found.");
      err.statusCode = 404;
      throw err;
    }
    return session;
  }

  /**
   * Converts recommended topics from a completed viva session into actionable NEXORA Tasks
   */
  static async convertRecommendationsToTasks(userId, sessionId) {
    const session = await VivaSession.findOne({ _id: sessionId, userId });
    if (!session) {
      const err = new Error("Viva session not found.");
      err.statusCode = 404;
      throw err;
    }

    const topics = session.summaryReport?.recommendedTopics || [];
    if (topics.length === 0) {
      return { count: 0, tasks: [] };
    }

    const createdTasks = [];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days study deadline

    for (const topic of topics) {
      const title = `Master Viva Topic: ${topic}`;
      const existing = await Task.findOne({ userId, title });
      if (!existing) {
        const task = await Task.create({
          userId,
          title,
          description: `Action item generated from ${session.topic} AI Socratic Viva (${session.summaryReport?.overallGrade || "Completed"}). Focus on deep conceptual review.`,
          category: "learning",
          priority: "high",
          dueDate
        });
        createdTasks.push(task);
      }
    }

    return {
      count: createdTasks.length,
      tasks: createdTasks
    };
  }
}

module.exports = VivaService;
