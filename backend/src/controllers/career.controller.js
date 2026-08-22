const careerService = require("../services/career.service");

const getCareers = async (_req, res, next) => {
  try {
    const careers = await careerService.getCareers();
    return res.status(200).json({ success: true, careers });
  } catch (error) {
    next(error);
  }
};

const getCareerById = async (req, res, next) => {
  try {
    const career = await careerService.getCareerById(req.params.id);
    return res.status(200).json({ success: true, career });
  } catch (error) {
    next(error);
  }
};

const getUserCareer = async (req, res, next) => {
  try {
    const analysis = await careerService.getUserCareerAnalysis(req.userId);
    return res.status(200).json({ success: true, ...analysis });
  } catch (error) {
    next(error);
  }
};

const updateUserCareer = async (req, res, next) => {
  try {
    const analysis = await careerService.updateUserCareer(req.userId, req.body);
    return res.status(200).json({ success: true, message: "Target career updated.", ...analysis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCareers,
  getCareerById,
  getUserCareer,
  updateUserCareer
};
