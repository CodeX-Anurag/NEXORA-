const analyticsService = require("../services/analytics.service");

const getDashboardAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboardAnalytics(req.userId);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getProductivityAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getProductivityAnalytics(req.userId);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getCareerAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getCareerAnalytics(req.userId);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getProductivityAnalytics,
  getCareerAnalytics
};
