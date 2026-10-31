const careerPlatformService = require("../services/careerPlatform.service");

const getPlatforms = async (req, res, next) => {
  try {
    const result = await careerPlatformService.getUserPlatforms(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const connectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const result = await careerPlatformService.connectOrSyncPlatform(req.userId, platform, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const refreshPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const result = await careerPlatformService.connectOrSyncPlatform(req.userId, platform, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const disconnectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const result = await careerPlatformService.disconnectPlatform(req.userId, platform);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateSelectedItems = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { selectedItems } = req.body;
    const result = await careerPlatformService.updateSelectedItems(req.userId, platform, selectedItems);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const syncToNexoraProjects = async (req, res, next) => {
  try {
    const result = await careerPlatformService.syncToNexoraProjects(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const syncToResumeProfile = async (req, res, next) => {
  try {
    const result = await careerPlatformService.syncToResumeProfile(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatforms,
  connectPlatform,
  refreshPlatform,
  disconnectPlatform,
  updateSelectedItems,
  syncToNexoraProjects,
  syncToResumeProfile
};
