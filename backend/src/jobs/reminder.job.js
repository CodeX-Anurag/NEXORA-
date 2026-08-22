const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");
const User = require("../models/User.model");
const notificationService = require("../services/notification.service");

/**
 * Process Task & Study Reminders Job Cycle
 */
const runReminderJob = async () => {
  const stats = {
    processedTasks: 0,
    processedUsers: 0,
    createdCount: 0,
    skippedDuplicates: 0,
    errorCount: 0
  };

  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dateWindowKey = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // 1. Process Task Deadline & Overdue Reminders
  try {
    const activeTasks = await Task.find({
      status: { $in: ["todo", "in_progress"] },
      deadline: { $ne: null }
    }).lean();

    stats.processedTasks = activeTasks.length;

    for (const task of activeTasks) {
      const deadline = new Date(task.deadline);
      const isDueSoon = deadline > now && deadline <= twentyFourHoursLater;
      const isOverdue = deadline < now;

      if (isDueSoon) {
        const dedupKey = `${task.userId}_TASK_DUE_SOON_${task._id}_24h`;
        const result = await notificationService.createNotificationIdempotent({
          userId: task.userId,
          type: "TASK_DUE_SOON",
          title: "Task Due Soon",
          message: `Your task "${task.title}" is due in less than 24 hours.`,
          relatedEntityId: task._id,
          relatedEntityType: "Task",
          deduplicationKey: dedupKey
        });

        if (result.created) stats.createdCount += 1;
        if (result.duplicate) stats.skippedDuplicates += 1;
      } else if (isOverdue) {
        const dedupKey = `${task.userId}_TASK_OVERDUE_${task._id}_overdue`;
        const result = await notificationService.createNotificationIdempotent({
          userId: task.userId,
          type: "TASK_OVERDUE",
          title: "Task Overdue",
          message: `Your task "${task.title}" is past its deadline.`,
          relatedEntityId: task._id,
          relatedEntityType: "Task",
          deduplicationKey: dedupKey
        });

        if (result.created) stats.createdCount += 1;
        if (result.duplicate) stats.skippedDuplicates += 1;
      }
    }
  } catch (err) {
    stats.errorCount += 1;
    console.warn(`[Reminder Job Warning] Task processing error: ${err.message}`);
  }

  // 2. Process Study Session Inactivity Reminders (48 Hours Inactive)
  try {
    const users = await User.find({}).lean();
    stats.processedUsers = users.length;
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    for (const user of users) {
      if (user.preferences && user.preferences.notifications === false) {
        continue;
      }

      const recentSession = await StudySession.findOne({ userId: user._id })
        .sort({ date: -1 })
        .lean();

      const lastStudyDate = recentSession ? new Date(recentSession.date) : new Date(user.createdAt);
      const isInactive = lastStudyDate < fortyEightHoursAgo;

      if (isInactive) {
        const dedupKey = `${user._id}_STUDY_REMINDER_${dateWindowKey}`;
        const result = await notificationService.createNotificationIdempotent({
          userId: user._id,
          type: "STUDY_REMINDER",
          title: "Study Session Reminder",
          message: "Keep your study streak active! You haven't logged a study session in over 48 hours.",
          relatedEntityId: recentSession ? recentSession._id : null,
          relatedEntityType: "StudySession",
          deduplicationKey: dedupKey
        });

        if (result.created) stats.createdCount += 1;
        if (result.duplicate) stats.skippedDuplicates += 1;
      }
    }
  } catch (err) {
    stats.errorCount += 1;
    console.warn(`[Reminder Job Warning] Study reminder error: ${err.message}`);
  }

  return stats;
};

module.exports = {
  runReminderJob
};
