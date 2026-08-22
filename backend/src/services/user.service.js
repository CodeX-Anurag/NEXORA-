const User = require("../models/User.model");
const AuthSession = require("../models/AuthSession.model");
const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");
const UserSkill = require("../models/UserSkill.model");
const Project = require("../models/Project.model");
const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");
const Memory = require("../models/Memory.model");
const Recommendation = require("../models/Recommendation.model");

/**
 * Get authenticated user profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User profile not found.");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    education: user.education,
    preferences: user.preferences,
    careerGoal: user.careerGoal,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Update authenticated user profile
 */
const updateUserProfile = async (userId, updateData) => {
  const allowedUpdates = ["name", "education", "preferences", "careerGoal"];
  const updates = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    education: user.education,
    preferences: user.preferences,
    careerGoal: user.careerGoal,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Delete user account and all user-owned records (tasks, study sessions, skills, projects, conversations, messages, memories, recommendations, auth sessions)
 */
const deleteUserAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  // Cascade delete all user-owned records
  await Promise.all([
    AuthSession.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    StudySession.deleteMany({ userId }),
    UserSkill.deleteMany({ userId }),
    Project.deleteMany({ userId }),
    Conversation.deleteMany({ userId }),
    Message.deleteMany({ userId }),
    Memory.deleteMany({ userId }),
    Recommendation.deleteMany({ userId })
  ]);

  // Delete user record
  await User.findByIdAndDelete(userId);

  return {
    success: true,
    message: "User account and all associated student data deleted successfully."
  };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
};
