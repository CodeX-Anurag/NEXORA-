const StudySession = require("../models/StudySession.model");

/**
 * Get paginated list of study sessions for authenticated user
 */
const getStudySessions = async (userId, query = {}) => {
  const page = parseInt(query.page || "1", 10);
  const limit = Math.min(parseInt(query.limit || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter = { userId };

  if (query.subject) {
    filter.subject = { $regex: query.subject, $options: "i" };
  }

  const [sessions, total] = await Promise.all([
    StudySession.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    StudySession.countDocuments(filter)
  ]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Record a study session for authenticated user
 */
const createStudySession = async (userId, sessionData) => {
  if (!sessionData.subject || !sessionData.duration) {
    const err = new Error("Subject and duration (in minutes) are required.");
    err.statusCode = 400;
    throw err;
  }

  const durationNum = parseInt(sessionData.duration, 10);
  if (isNaN(durationNum) || durationNum < 1) {
    const err = new Error("Duration must be a positive number of minutes.");
    err.statusCode = 400;
    throw err;
  }

  const session = await StudySession.create({
    userId,
    subject: sessionData.subject.trim(),
    duration: durationNum,
    date: sessionData.date ? new Date(sessionData.date) : new Date(),
    notes: sessionData.notes || ""
  });

  return session;
};

/**
 * Get single study session by ID (scoped to authenticated user)
 */
const getStudySessionById = async (userId, sessionId) => {
  const session = await StudySession.findOne({ _id: sessionId, userId }).lean();
  if (!session) {
    const err = new Error("Study session not found.");
    err.statusCode = 404;
    throw err;
  }
  return session;
};

/**
 * Delete study session by ID (scoped to authenticated user)
 */
const deleteStudySession = async (userId, sessionId) => {
  const session = await StudySession.findOneAndDelete({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Study session not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  return { success: true, message: "Study session deleted successfully." };
};

module.exports = {
  getStudySessions,
  createStudySession,
  getStudySessionById,
  deleteStudySession
};
