const studyService = require("../services/study.service");

const getStudySessions = async (req, res, next) => {
  try {
    const result = await studyService.getStudySessions(req.userId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const createStudySession = async (req, res, next) => {
  try {
    const session = await studyService.createStudySession(req.userId, req.body);
    return res.status(201).json({ success: true, message: "Study session recorded successfully.", session });
  } catch (error) {
    next(error);
  }
};

const getStudySessionById = async (req, res, next) => {
  try {
    const session = await studyService.getStudySessionById(req.userId, req.params.id);
    return res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

const deleteStudySession = async (req, res, next) => {
  try {
    const result = await studyService.deleteStudySession(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudySessions,
  createStudySession,
  getStudySessionById,
  deleteStudySession
};
