const healthService = require("../services/health.service");

const getHealth = (_req, res, next) => {
  try {
    const status = healthService.getHealthStatus();
    return res.status(200).json(status);
  } catch (error) {
    return next(error);
  }
};

const getReadiness = (_req, res, next) => {
  try {
    const status = healthService.getReadinessStatus();
    return res.status(200).json(status);
  } catch (error) {
    return next(error);
  }
};

const getDiagnostics = async (req, res, next) => {
  try {
    const diagnostics = await healthService.getDiagnosticsStatus(req.userId);
    return res.status(200).json(diagnostics);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getHealth,
  getReadiness,
  getDiagnostics
};
