const Notification = require("../models/Notification.model");

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
 * Get all notifications for authenticated user
 */
const getUserNotifications = async (userId, { limit = 50, unreadOnly = false } = {}) => {
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  return {
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

module.exports = {
  createNotificationIdempotent,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
