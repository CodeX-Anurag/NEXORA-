const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");

/**
 * Calculates next date for recurring task based on recurrence interval
 */
const calculateNextRecurrenceDate = (baseDate, recurrence) => {
  const next = new Date(baseDate || Date.now());
  if (recurrence === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
};

/**
 * Get tasks for authenticated user with search, filtering, and sorting
 */
const getTasks = async (userId, query = {}) => {
  const page = parseInt(query.page || "1", 10);
  const limit = Math.min(parseInt(query.limit || "100", 10), 200);
  const skip = (page - 1) * limit;

  const filter = { userId };

  // Status Filter
  if (query.status) {
    if (query.status.includes(",")) {
      filter.status = { $in: query.status.split(",").map((s) => s.trim()) };
    } else {
      filter.status = query.status.trim();
    }
  }

  // Priority Filter
  if (query.priority) {
    if (query.priority.includes(",")) {
      filter.priority = { $in: query.priority.split(",").map((p) => p.trim()) };
    } else {
      filter.priority = query.priority.trim();
    }
  }

  // Category Filter
  if (query.category) {
    filter.category = query.category.trim();
  }

  // Search Filter (matches title and description)
  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    filter.$or = [
      { title: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { tags: { $in: [new RegExp(term, "i")] } }
    ];
  }

  // Source Filter
  if (query.source) {
    filter.source = query.source;
  }

  // My Day Filter
  if (query.myDay === "true" || query.myDay === true) {
    filter.isMyDay = true;
  }

  // Due Date Range Filter
  if (query.dueRange) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (query.dueRange === "today") {
      filter.deadline = { $gte: startOfToday, $lte: endOfToday };
    } else if (query.dueRange === "overdue") {
      filter.deadline = { $lt: startOfToday };
      filter.status = { $ne: "completed" };
    } else if (query.dueRange === "upcoming") {
      filter.deadline = { $gt: endOfToday };
      filter.status = { $ne: "completed" };
    } else if (query.dueRange === "this_week") {
      filter.deadline = { $gte: startOfToday, $lte: endOfWeek };
    } else if (query.dueRange === "no_date") {
      filter.deadline = null;
    }
  }

  // Sorting
  let sortOption = { deadline: 1, createdAt: -1 };
  if (query.sortBy === "dueDate_desc") {
    sortOption = { deadline: -1, createdAt: -1 };
  } else if (query.sortBy === "newest") {
    sortOption = { createdAt: -1 };
  } else if (query.sortBy === "updated") {
    sortOption = { updatedAt: -1 };
  } else if (query.sortBy === "alphabetical") {
    sortOption = { title: 1 };
  } else if (query.sortBy === "priority") {
    // Standard sort will order by deadline, frontend handles custom priority rank sorting
    sortOption = { priority: 1, deadline: 1 };
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sortOption).skip(skip).limit(limit).lean({ virtuals: true }),
    Task.countDocuments(filter)
  ]);

  return {
    success: true,
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
 * Create task for authenticated user
 */
const createTask = async (userId, taskData) => {
  if (!taskData.title || typeof taskData.title !== "string" || !taskData.title.trim()) {
    const err = new Error("Task title is required.");
    err.statusCode = 400;
    throw err;
  }

  // Idempotent Deduplication Check
  if (taskData.deduplicationKey) {
    const existingTask = await Task.findOne({
      userId,
      deduplicationKey: taskData.deduplicationKey
    });
    if (existingTask) {
      return existingTask;
    }
  }

  // Format subtasks if passed as string array or objects
  let formattedSubtasks = [];
  if (Array.isArray(taskData.subtasks)) {
    formattedSubtasks = taskData.subtasks
      .map((st) => {
        if (typeof st === "string" && st.trim()) {
          return { title: st.trim(), completed: false };
        }
        if (st && typeof st === "object" && st.title) {
          return {
            title: st.title.trim(),
            completed: !!st.completed,
            completedAt: st.completed ? new Date() : null
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  // Format links
  let formattedLinks = [];
  if (Array.isArray(taskData.links)) {
    formattedLinks = taskData.links
      .filter((l) => l && l.url)
      .map((l) => ({ title: l.title || "", url: l.url.trim() }));
  }

  const task = await Task.create({
    userId,
    title: taskData.title.trim(),
    description: taskData.description ? taskData.description.trim() : "",
    status: ["todo", "in_progress", "in_review", "completed"].includes(taskData.status)
      ? taskData.status
      : "todo",
    priority: ["low", "medium", "high", "urgent"].includes(taskData.priority)
      ? taskData.priority
      : "medium",
    deadline: taskData.deadline || taskData.dueAt ? new Date(taskData.deadline || taskData.dueAt) : null,
    category: taskData.category ? taskData.category.trim() : "General",
    estimatedMinutes: Number(taskData.estimatedMinutes) || 0,
    actualMinutes: Number(taskData.actualMinutes) || 0,
    subtasks: formattedSubtasks,
    recurrence: ["none", "daily", "weekly", "monthly"].includes(taskData.recurrence)
      ? taskData.recurrence
      : "none",
    notes: taskData.notes ? taskData.notes.trim() : "",
    isMyDay: Boolean(taskData.isMyDay),
    myDayDate: taskData.isMyDay ? new Date() : null,
    links: formattedLinks,
    tags: Array.isArray(taskData.tags) ? taskData.tags.map((t) => String(t).trim()).filter(Boolean) : [],
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
  const task = await Task.findOne({ _id: taskId, userId }).lean({ virtuals: true });
  if (!task) {
    const err = new Error("Task not found or access denied.");
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
    "dueAt",
    "category",
    "estimatedMinutes",
    "actualMinutes",
    "subtasks",
    "recurrence",
    "notes",
    "isMyDay",
    "myDayDate",
    "links",
    "tags",
    "source",
    "roadmapRole",
    "roadmapStage"
  ];

  const updates = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      if (key === "deadline" || key === "dueAt") {
        updates.deadline = updateData[key] ? new Date(updateData[key]) : null;
      } else if (key === "subtasks" && Array.isArray(updateData.subtasks)) {
        updates.subtasks = updateData.subtasks
          .map((st) => {
            if (typeof st === "string" && st.trim()) {
              return { title: st.trim(), completed: false };
            }
            if (st && typeof st === "object" && st.title) {
              return {
                title: st.title.trim(),
                completed: !!st.completed,
                completedAt: st.completed ? (st.completedAt ? new Date(st.completedAt) : new Date()) : null
              };
            }
            return null;
          })
          .filter(Boolean);
      } else {
        updates[key] = updateData[key];
      }
    }
  }

  // Handle completedAt timestamp
  if (updates.status === "completed") {
    updates.completedAt = new Date();
  } else if (updates.status && updates.status !== "completed") {
    updates.completedAt = null;
  }

  const existingTask = await Task.findOne({ _id: taskId, userId });
  if (!existingTask) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  // Recurring Task Logic: If task was just marked completed and recurrence is active, schedule next instance
  if (
    updates.status === "completed" &&
    existingTask.status !== "completed" &&
    updatedTask.recurrence &&
    updatedTask.recurrence !== "none"
  ) {
    const nextDate = calculateNextRecurrenceDate(updatedTask.deadline || new Date(), updatedTask.recurrence);
    const dedupeKey = `recurring-${updatedTask._id}-${nextDate.toISOString().split("T")[0]}`;

    // Create next occurrence without duplicating
    await createTask(userId, {
      title: updatedTask.title,
      description: updatedTask.description,
      category: updatedTask.category,
      priority: updatedTask.priority,
      deadline: nextDate,
      estimatedMinutes: updatedTask.estimatedMinutes,
      recurrence: updatedTask.recurrence,
      notes: updatedTask.notes,
      links: updatedTask.links,
      tags: updatedTask.tags,
      subtasks: updatedTask.subtasks.map((st) => ({ title: st.title, completed: false })),
      deduplicationKey: dedupeKey,
      source: "manual"
    });
  }

  return updatedTask;
};

/**
 * Toggle or set My Day status for a task
 */
const toggleMyDay = async (userId, taskId, isMyDay) => {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  const nextVal = typeof isMyDay === "boolean" ? isMyDay : !task.isMyDay;
  task.isMyDay = nextVal;
  task.myDayDate = nextVal ? new Date() : null;
  await task.save();
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

/**
 * Toggle subtask completion status
 */
const toggleSubtask = async (userId, taskId, subtaskId, completed) => {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) {
    const err = new Error("Subtask not found.");
    err.statusCode = 404;
    throw err;
  }

  subtask.completed = completed !== undefined ? !!completed : !subtask.completed;
  subtask.completedAt = subtask.completed ? new Date() : null;

  await task.save();
  return task;
};

/**
 * Add a new subtask to an existing task
 */
const addSubtask = async (userId, taskId, title) => {
  if (!title || !title.trim()) {
    const err = new Error("Subtask title is required.");
    err.statusCode = 400;
    throw err;
  }

  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  task.subtasks.push({ title: title.trim(), completed: false });
  await task.save();
  return task;
};

/**
 * Delete a subtask from an existing task
 */
const deleteSubtask = async (userId, taskId, subtaskId) => {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  task.subtasks.pull({ _id: subtaskId });
  await task.save();
  return task;
};

/**
 * Records focus session for a task, increments actualMinutes, and creates a StudySession record
 */
const recordFocusSession = async (userId, taskId, { minutes, notes = "" }) => {
  const dur = Number(minutes);
  if (isNaN(dur) || dur < 1) {
    const err = new Error("Focus duration must be at least 1 minute.");
    err.statusCode = 400;
    throw err;
  }

  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    const err = new Error("Task not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  // Increment actualMinutes on task
  task.actualMinutes = (task.actualMinutes || 0) + dur;
  await task.save();

  // Create unified StudySession record in study tracker
  const studySession = await StudySession.create({
    userId,
    subject: task.category && task.category !== "General" ? task.category : task.title,
    duration: dur,
    date: new Date(),
    notes: notes || `Completed focus session on task: "${task.title}"`
  });

  return {
    success: true,
    message: `Recorded ${dur} minutes of focus session.`,
    task,
    studySession
  };
};

/**
 * Calculates comprehensive task analytics from real user task data
 */
const getTaskAnalytics = async (userId) => {
  const tasks = await Task.find({ userId }).lean({ virtuals: true });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Counts by metric
  let dueTodayCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;
  let completedThisWeekCount = 0;

  let estimatedTotalMinutes = 0;
  let actualTotalMinutes = 0;

  const statusCounts = { todo: 0, in_progress: 0, in_review: 0, completed: 0 };
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  const categoryCounts = {};

  // Initialize last 7 days trend
  const trendMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    trendMap[dateStr] = 0;
  }

  tasks.forEach((task) => {
    // Status breakdown
    if (statusCounts[task.status] !== undefined) {
      statusCounts[task.status]++;
    }

    // Priority breakdown
    if (priorityCounts[task.priority] !== undefined) {
      priorityCounts[task.priority]++;
    }

    // Category breakdown
    const cat = task.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Time totals
    estimatedTotalMinutes += task.estimatedMinutes || 0;
    actualTotalMinutes += task.actualMinutes || 0;

    // Due date analytics
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      if (deadline >= startOfToday && deadline <= endOfToday) {
        dueTodayCount++;
      } else if (deadline < startOfToday && task.status !== "completed") {
        overdueCount++;
      } else if (deadline > endOfToday && task.status !== "completed") {
        upcomingCount++;
      }
    }

    // Completed this week
    if (task.status === "completed" && task.completedAt) {
      const compDate = new Date(task.completedAt);
      if (compDate >= startOfWeek) {
        completedThisWeekCount++;
      }
      const compKey = compDate.toISOString().split("T")[0];
      if (trendMap[compKey] !== undefined) {
        trendMap[compKey]++;
      }
    }
  });

  const completionTrend = Object.keys(trendMap).map((date) => ({
    date,
    day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    count: trendMap[date]
  }));

  return {
    success: true,
    overview: {
      totalTasks,
      completedTasks,
      completionRate,
      dueTodayCount,
      overdueCount,
      upcomingCount,
      completedThisWeekCount
    },
    statusCounts,
    priorityCounts,
    categoryCounts,
    completionTrend,
    focusTime: {
      estimatedTotalMinutes,
      actualTotalMinutes
    }
  };
};

module.exports = {
  calculateNextRecurrenceDate,
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  toggleMyDay,
  deleteTask,
  toggleSubtask,
  addSubtask,
  deleteSubtask,
  recordFocusSession,
  getTaskAnalytics
};
