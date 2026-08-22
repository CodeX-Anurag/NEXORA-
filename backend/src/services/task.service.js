const Task = require("../models/Task.model");

/**
 * Get paginated list of tasks for authenticated user
 */
const getTasks = async (userId, query = {}) => {
  const page = parseInt(query.page || "1", 10);
  const limit = Math.min(parseInt(query.limit || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter = { userId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.source) {
    filter.source = query.source;
  }

  if (query.search) {
    filter.title = { $regex: query.search, $options: "i" };
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ deadline: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Task.countDocuments(filter)
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Create task for authenticated user (with Substep 12B Idempotent Deduplication check)
 */
const createTask = async (userId, taskData) => {
  if (!taskData.title) {
    const err = new Error("Task title is required.");
    err.statusCode = 400;
    throw err;
  }

  // Idempotent Deduplication Check for AI Roadmap conversions
  if (taskData.deduplicationKey) {
    const existingTask = await Task.findOne({ userId, deduplicationKey: taskData.deduplicationKey });
    if (existingTask) {
      return existingTask;
    }
  }

  const task = await Task.create({
    userId,
    title: taskData.title.trim(),
    description: taskData.description || "",
    status: taskData.status || "todo",
    priority: taskData.priority || "medium",
    deadline: taskData.deadline ? new Date(taskData.deadline) : null,
    source: taskData.source || "manual",
    roadmapRole: taskData.roadmapRole || "",
    roadmapStage: taskData.roadmapStage || "",
    deduplicationKey: taskData.deduplicationKey || null
  });

  return task;
};

/**
 * Get single task by ID (scoped to authenticated user)
 */
const getTaskById = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, userId }).lean();
  if (!task) {
    const err = new Error("Task not found.");
    err.statusCode = 404;
    throw err;
  }
  return task;
};

/**
 * Update task by ID (scoped to authenticated user)
 */
const updateTask = async (userId, taskId, updateData) => {
  const allowedUpdates = [
    "title",
    "description",
    "status",
    "priority",
    "deadline",
    "source",
    "roadmapRole",
    "roadmapStage"
  ];
  const updates = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      if (key === "deadline") {
        updates[key] = updateData[key] ? new Date(updateData[key]) : null;
      } else {
        updates[key] = updateData[key];
      }
    }
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!task) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  return task;
};

/**
 * Delete task by ID (scoped to authenticated user)
 */
const deleteTask = async (userId, taskId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, userId });
  if (!task) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  return { success: true, message: "Task deleted successfully." };
};

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
};
