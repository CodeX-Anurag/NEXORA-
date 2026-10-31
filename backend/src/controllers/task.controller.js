const mongoose = require("mongoose");
const taskService = require("../services/task.service");
const taskAIService = require("../services/taskAI.service");
const Task = require("../models/Task.model");

/**
 * GET /api/v1/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getTasks(req.userId, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.userId, req.body);
    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.userId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/tasks/:id/my-day
 */
const toggleMyDay = async (req, res, next) => {
  try {
    const { isMyDay } = req.body;
    const task = await taskService.toggleMyDay(req.userId, req.params.id, isMyDay);
    return res.status(200).json({
      success: true,
      message: task.isMyDay ? "Task added to My Day." : "Task removed from My Day.",
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tasks/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await taskService.getTaskAnalytics(req.userId);
    return res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/tasks/:id/subtasks/:subtaskId
 */
const toggleSubtask = async (req, res, next) => {
  try {
    const { completed } = req.body;
    const task = await taskService.toggleSubtask(
      req.userId,
      req.params.id,
      req.params.subtaskId,
      completed
    );
    return res.status(200).json({
      success: true,
      message: "Subtask updated.",
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tasks/:id/subtasks
 */
const addSubtask = async (req, res, next) => {
  try {
    const { title } = req.body;
    const task = await taskService.addSubtask(req.userId, req.params.id, title);
    return res.status(201).json({
      success: true,
      message: "Subtask added.",
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/tasks/:id/subtasks/:subtaskId
 */
const deleteSubtask = async (req, res, next) => {
  try {
    const task = await taskService.deleteSubtask(req.userId, req.params.id, req.params.subtaskId);
    return res.status(200).json({
      success: true,
      message: "Subtask deleted.",
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tasks/:id/focus-session
 */
const recordFocusSession = async (req, res, next) => {
  try {
    const result = await taskService.recordFocusSession(req.userId, req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tasks/ai/breakdown
 */
const aiBreakdown = async (req, res, next) => {
  try {
    const { goal, context } = req.body;
    const result = await taskAIService.breakdownGoal(goal, context);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tasks/ai/daily-plan
 */
const aiDailyPlan = async (req, res, next) => {
  try {
    const { availableHours } = req.body;
    let tasks = [];
    if (mongoose.connection.readyState === 1) {
      tasks = await Task.find({ userId: req.userId }).lean({ virtuals: true });
    }
    const result = await taskAIService.generateDailyPlan(tasks, Number(availableHours) || 6);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tasks/ai/risk-detection
 */
const aiRiskDetection = async (req, res, next) => {
  try {
    let tasks = [];
    if (mongoose.connection.readyState === 1) {
      tasks = await Task.find({ userId: req.userId }).lean({ virtuals: true });
    }
    const result = taskAIService.detectDeadlineRisks(tasks);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tasks/:id/ai/smart-reschedule
 */
const aiSmartReschedule = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.userId, req.params.id);
    let allTasks = [];
    if (mongoose.connection.readyState === 1) {
      allTasks = await Task.find({ userId: req.userId }).lean({ virtuals: true });
    }
    const result = taskAIService.suggestSmartReschedule(task, allTasks);
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
  toggleMyDay,
  deleteTask,
  getAnalytics,
  toggleSubtask,
  addSubtask,
  deleteSubtask,
  recordFocusSession,
  aiBreakdown,
  aiDailyPlan,
  aiRiskDetection,
  aiSmartReschedule
};
