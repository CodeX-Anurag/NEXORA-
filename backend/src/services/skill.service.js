const Skill = require("../models/Skill.model");
const UserSkill = require("../models/UserSkill.model");
const { SKILLS_SEED } = require("../seed/careerData");

/**
 * Get Skill catalog (seeds if empty, falls back to seed memory if DB offline)
 */
const getSkillCatalog = async () => {
  try {
    let skills = await Skill.find().sort({ category: 1, name: 1 });
    if (!skills || skills.length === 0) {
      skills = await Skill.insertMany(SKILLS_SEED);
    }
    return skills;
  } catch {
    return SKILLS_SEED;
  }
};

/**
 * Get user skills
 */
const getUserSkills = async (userId) => {
  return await UserSkill.find({ userId }).sort({ currentLevel: -1 });
};

/**
 * Add or set a user skill rating
 */
const addUserSkill = async (userId, { skillName, currentLevel }) => {
  if (!skillName || currentLevel === undefined) {
    const err = new Error("Skill name and current level (0-100) are required.");
    err.statusCode = 400;
    throw err;
  }

  const levelNum = parseInt(currentLevel, 10);
  if (isNaN(levelNum) || levelNum < 0 || levelNum > 100) {
    const err = new Error("Skill level must be a number between 0 and 100.");
    err.statusCode = 400;
    throw err;
  }

  const userSkill = await UserSkill.findOneAndUpdate(
    { userId, skillName: skillName.trim() },
    { $set: { currentLevel: levelNum } },
    { new: true, upsert: true, runValidators: true }
  );

  return userSkill;
};

/**
 * Update user skill level by ID
 */
const updateUserSkill = async (userId, skillId, { currentLevel }) => {
  const levelNum = parseInt(currentLevel, 10);
  if (isNaN(levelNum) || levelNum < 0 || levelNum > 100) {
    const err = new Error("Skill level must be a number between 0 and 100.");
    err.statusCode = 400;
    throw err;
  }

  const userSkill = await UserSkill.findOneAndUpdate(
    { _id: skillId, userId },
    { $set: { currentLevel: levelNum } },
    { new: true, runValidators: true }
  );

  if (!userSkill) {
    const err = new Error("User skill not found.");
    err.statusCode = 404;
    throw err;
  }

  return userSkill;
};

/**
 * Delete user skill by ID
 */
const deleteUserSkill = async (userId, skillId) => {
  const userSkill = await UserSkill.findOneAndDelete({ _id: skillId, userId });
  if (!userSkill) {
    const err = new Error("User skill not found.");
    err.statusCode = 404;
    throw err;
  }
  return { success: true, message: "User skill removed successfully." };
};

module.exports = {
  getSkillCatalog,
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill
};
