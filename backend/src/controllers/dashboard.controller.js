const dashboardService = require("../services/dashboard.service");

const getOverview = async (req, res, next) => {
  try {
    const overview = await dashboardService.getDashboardOverview(req.userId);
    return res.status(200).json({ success: true, ...overview });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview
};
