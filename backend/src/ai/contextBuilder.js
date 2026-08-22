const MemoryRetriever = require("./memoryRetriever");
const { getUserCareerAnalysis } = require("../services/career.service");
const User = require("../models/User.model");
const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");

/**
 * Context Builder: Combines multi-source platform context for LLM prompt with security boundaries
 */
class ContextBuilder {
  static async buildContext(userId, promptText, messages = [], conversationOptions = {}) {
    const isFreshChat = conversationOptions.isFreshChat || false;

    // 1. Fetch User Profile
    const user = await User.findById(userId);
    const preferences = user?.preferences || {};

    let systemContext = "";

    if (!isFreshChat && preferences.profileMemoryEnabled !== false) {
      // 2. Fetch Career Analysis & Skill Gaps
      let careerAnalysis = null;
      try {
        careerAnalysis = await getUserCareerAnalysis(userId);
      } catch {
        // ignore
      }

      // 3. Fetch Recent Tasks & Study Sessions
      const [recentTasks, recentStudy] = await Promise.all([
        Task.find({ userId }).sort({ createdAt: -1 }).limit(3),
        StudySession.find({ userId }).sort({ date: -1 }).limit(3)
      ]);

      // 4. Retrieve Relevant Memories (Privacy Governed & User-Scoped)
      const rawMemories = await MemoryRetriever.retrieveRelevantMemories(
        userId,
        promptText,
        preferences
      );

      // Truncate individual memory items to max 300 characters to prevent context flood/attacks
      const boundedMemories = rawMemories.slice(0, 5).map((m) => {
        const text = typeof m === "string" ? m : String(m);
        return text.length > 300 ? `${text.slice(0, 300)}...` : text;
      });

      // Build structured context text with untrusted data delimiters
      systemContext = `[STUDENT BACKGROUND CONTEXT (UNTRUSTED DATA)]
- Student Name: ${user?.name || "Student"}
- Target Role: ${careerAnalysis?.targetRole || "Software Engineer"}
- NEXORA Career Readiness Score: ${careerAnalysis?.careerReadinessScore || 0}%
- Critical Skill Gaps: ${careerAnalysis?.criticalGapsCount || 0}
- Recent Focus Tasks: ${recentTasks.map((t) => t.title).join(", ") || "None"}
- Recent Study: ${recentStudy.map((s) => `${s.subject} (${s.duration}m)`).join(", ") || "None"}

<untrusted_student_memories>
${boundedMemories.length > 0 ? boundedMemories.map((m, idx) => `[Memory ${idx + 1}]: ${m}`).join("\n") : "None"}
</untrusted_student_memories>
`;
    } else {
      systemContext = `[PRIVATE / FRESH CHAT CONTEXT]
- Note: Long-term student memories and background profile reads are disabled for this session.
`;
    }

    // 5. Bounded recent conversation context (last 15 messages)
    let boundedMessages = messages.slice(-15).map((m) => ({
      role: m.role,
      content: m.content
    }));

    if (preferences.conversationMemoryEnabled === false && boundedMessages.length > 0) {
      boundedMessages = boundedMessages.slice(-1);
    }

    return {
      systemContext,
      boundedMessages
    };
  }
}

module.exports = ContextBuilder;
