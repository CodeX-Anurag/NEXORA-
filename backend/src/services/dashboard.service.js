const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");

/**
 * Compute deterministic dashboard overview metrics for authenticated user
 */
const getDashboardOverview = async (userId) => {
  const [tasks, studySessions] = await Promise.all([
    Task.find({ userId }).sort({ createdAt: -1 }),
    StudySession.find({ userId }).sort({ date: -1, createdAt: -1 })
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;

  const recentTasks = tasks.slice(0, 5);
  const recentStudySessions = studySessions.slice(0, 5);

  return {
    metrics: {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      totalStudyMinutes,
      totalStudyHours
    },
    recentTasks,
    recentStudySessions
  };
};

module.exports = {
  getDashboardOverview
};
