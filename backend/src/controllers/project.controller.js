const projectService = require("../services/project.service");

const getProjects = async (req, res, next) => {
  try {
    const result = await projectService.getProjects(req.userId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.userId, req.body);
    return res.status(201).json({ success: true, message: "Project created successfully.", project });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.userId, req.params.id);
    return res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.userId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Project updated successfully.", project });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
};
