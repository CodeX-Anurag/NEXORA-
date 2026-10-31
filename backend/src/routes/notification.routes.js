const express = require("express");
const notificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/v1/notifications — Get user notifications (supports filter=all|unread|archived)
router.get("/", notificationController.getNotifications);

// POST /api/v1/notifications/check-reminders — Scans user tasks and generates reminders
router.post("/check-reminders", notificationController.checkReminders);

// PATCH /api/v1/notifications/read-all — Mark all as read
router.patch("/read-all", notificationController.markAllAsRead);

// PATCH /api/v1/notifications/:id/read — Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);

// PATCH /api/v1/notifications/:id/archive — Archive notification
router.patch("/:id/archive", notificationController.archiveNotification);

// DELETE /api/v1/notifications/:id — Delete notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
