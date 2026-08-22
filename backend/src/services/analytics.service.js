const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");
const Project = require("../models/Project.model");
const { getUserCareerAnalysis } = require("./career.service");

/**
 * Combined dashboard analytics
 */
const getDashboardAnalytics = async (userId) => {
  const [tasks, studySessions, projects, careerAnalysis] = await Promise.all([
    Task.find({ userId }),
    StudySession.find({ userId }),
    Project.find({ userId }),
    getUserCareerAnalysis(userId)
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;

  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  return {
    productivity: {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      totalStudyMinutes,
      totalStudyHours
    },
    projects: {
      totalProjects,
      completedProjects
    },
    career: {
      targetRole: careerAnalysis.targetRole,
      careerReadinessScore: careerAnalysis.careerReadinessScore,
      criticalGapsCount: careerAnalysis.criticalGapsCount,
      acquiredSkillsCount: careerAnalysis.acquiredSkillsCount
    }
  };
};

/**
 * Detailed productivity analytics (task status breakdown, subject study distribution)
 */
const getProductivityAnalytics = async (userId) => {
  const [tasks, studySessions] = await Promise.all([
    Task.find({ userId }),
    StudySession.find({ userId })
  ]);

  // Task status distribution
  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length
  };

  // Priority distribution
  const priorityCounts = {
    low: tasks.filter((t) => t.priority === "low").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    high: tasks.filter((t) => t.priority === "high").length
  };

  // Subject study minutes aggregation
  const subjectMap = {};
  for (const session of studySessions) {
    const subject = session.subject;
    subjectMap[subject] = (subjectMap[subject] || 0) + session.duration;
  }

  const studyBySubject = Object.entries(subjectMap).map(([subject, minutes]) => ({
    subject,
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10
  }));

  return {
    statusCounts,
    priorityCounts,
    studyBySubject
  };
};

/**
 * Detailed career readiness analytics
 */
const getCareerAnalytics = async (userId) => {
  return await getUserCareerAnalysis(userId);
};

module.exports = {
  getDashboardAnalytics,
  getProductivityAnalytics,
  getCareerAnalytics
};
