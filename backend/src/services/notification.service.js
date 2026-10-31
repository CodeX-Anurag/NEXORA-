const Notification = require("../models/Notification.model");
const Task = require("../models/Task.model");

/**
 * Creates a notification with database-level idempotency
 */
const createNotificationIdempotent = async ({
  userId,
  type,
  title,
  message,
  relatedEntityId = null,
  relatedEntityType = "System",
  metadata = {},
  deduplicationKey
}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
      metadata,
      deduplicationKey
    });
    return { created: true, duplicate: false, notification };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error swallowed cleanly for idempotency
      return { created: false, duplicate: true, notification: null };
    }
    throw error;
  }
};

/**
 * Get all notifications for authenticated user with tab filtering
 */
const getUserNotifications = async (
  userId,
  { limit = 50, filter = "all", unreadOnly = false, autoScan = true } = {}
) => {
  // Automatically check & generate idempotent task deadline reminders during normal usage
  if (autoScan) {
    try {
      await checkAndGenerateTaskReminders(userId);
    } catch {
      // Swallowed safely
    }
  }

  const query = { userId };

  if (filter === "archived") {
    query.isArchived = true;
  } else if (filter === "unread" || unreadOnly) {
    query.isRead = false;
    query.isArchived = { $ne: true };
  } else {
    // "all" tab shows non-archived notifications
    query.isArchived = { $ne: true };
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    userId,
    isRead: false,
    isArchived: { $ne: true }
  });

  return {
    success: true,
    notifications,
    unreadCount
  };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    const err = new Error("Notification not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  return notification;
};

/**
 * Mark all notifications as read for user
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return { success: true, message: "All notifications marked as read." };
};

/**
 * Archive a notification
 */
const archiveNotification = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isArchived: true },
    { new: true }
  );

  if (!notification) {
    const err = new Error("Notification not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  return notification;
};

/**
 * Delete a notification
 */
const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

  if (!notification) {
    const err = new Error("Notification not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  return { success: true, message: "Notification deleted successfully." };
};

/**
 * Checks for tasks due soon or overdue and generates idempotent reminders
 */
const checkAndGenerateTaskReminders = async (userId) => {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const todayKey = now.toISOString().split("T")[0];

  const pendingTasks = await Task.find({
    userId,
    status: { $ne: "completed" },
    deadline: { $ne: null }
  }).lean();

  let remindersCreated = 0;

  for (const task of pendingTasks) {
    const deadline = new Date(task.deadline);

    // Overdue task reminder
    if (deadline < now) {
      const res = await createNotificationIdempotent({
        userId,
        type: "TASK_OVERDUE",
        title: `Overdue Task: ${task.title}`,
        message: `Task "${task.title}" was due on ${deadline.toLocaleDateString()}. Consider completing or rescheduling it.`,
        relatedEntityId: task._id,
        relatedEntityType: "Task",
        deduplicationKey: `task-overdue-${task._id}-${todayKey}`
      });
      if (res.created) remindersCreated++;
    }
    // Due soon reminder (within 24 hours)
    else if (deadline <= next24h) {
      const hoursRemaining = Math.max(1, Math.round((deadline - now) / (1000 * 60 * 60)));
      const res = await createNotificationIdempotent({
        userId,
        type: "TASK_DUE_SOON",
        title: `Task Due Soon: ${task.title}`,
        message: `Task "${task.title}" is due in approximately ${hoursRemaining} hour${hoursRemaining > 1 ? "s" : ""}.`,
        relatedEntityId: task._id,
        relatedEntityType: "Task",
        deduplicationKey: `task-duesoon-${task._id}-${todayKey}`
      });
      if (res.created) remindersCreated++;
    }
  }

  return {
    success: true,
    remindersCreated,
    timestamp: now
  };
};

module.exports = {
  createNotificationIdempotent,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  checkAndGenerateTaskReminders
};
