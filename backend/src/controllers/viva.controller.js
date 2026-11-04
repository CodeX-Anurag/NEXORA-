const VivaService = require("../services/viva.service");

/**
 * Start a new Socratic Viva Exam
 * POST /api/v1/viva/start
 */
const startSession = async (req, res, next) => {
  try {
    const { topic, difficulty, maxRounds, focusArea, answerMode, language } = req.body;
    const session = await VivaService.startSession(req.userId, {
      topic,
      difficulty,
      maxRounds,
      focusArea,
      answerMode,
      language
    });

    const activeRound = session.rounds?.[session.currentRound - 1] || session.rounds?.[0] || null;

    return res.status(201).json({
      success: true,
      message: `Viva examination on "${session.topic}" initialized successfully.`,
      session,
      activeRound
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit spoken or typed answer to the active round
 * POST /api/v1/viva/:id/submit
 */
const submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const answer = req.body.answer || req.body.studentAnswer;

    const result = await VivaService.submitAnswer(req.userId, id, { answer });
    const isFinished = Boolean(result.isCompleted || result.session?.status === "completed");
    const nextRound = isFinished
      ? null
      : (result.session?.rounds?.[result.session.currentRound - 1] || null);

    return res.status(200).json({
      success: true,
      ...result,
      isFinished,
      nextRound
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's past viva history
 * GET /api/v1/viva/history
 */
const getHistory = async (req, res, next) => {
  try {
    const history = await VivaService.getHistory(req.userId);
    return res.status(200).json({
      success: true,
      count: history.length,
      history,
      sessions: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full session details by ID
 * GET /api/v1/viva/:id
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await VivaService.getSessionById(req.userId, id);

    return res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert weak areas / recommended topics to NEXORA study tasks
 * POST /api/v1/viva/:id/create-tasks
 */
const convertRecommendationsToTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await VivaService.convertRecommendationsToTasks(req.userId, id);

    return res.status(200).json({
      success: true,
      message: `Successfully created ${result.count} study task(s) from your viva review recommendations.`,
      tasks: result.tasks,
      tasksCreatedCount: result.count
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  submitAnswer,
  getHistory,
  getSessionById,
  convertRecommendationsToTasks
};
