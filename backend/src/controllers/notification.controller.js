const notificationService = require("../services/notification.service");

const getNotifications = async (req, res, next) => {
  try {
    const { limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.userId, {
      limit: limit ? parseInt(limit, 10) : 50,
      unreadOnly: unreadOnly === "true"
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
