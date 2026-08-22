const taskService = require("../services/task.service");

const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getTasks(req.userId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.userId, req.body);
    return res.status(201).json({ success: true, message: "Task created successfully.", task });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.userId, req.params.id);
    return res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.userId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Task updated successfully.", task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
};
