const CareerGoal = require("../models/CareerGoal.model");
const User = require("../models/User.model");
const UserSkill = require("../models/UserSkill.model");
const { CAREERS_SEED } = require("../seed/careerData");

/**
 * Get career catalog (seeds if empty, falls back to seed memory if DB offline)
 */
const getCareers = async () => {
  try {
    let careers = await CareerGoal.find().sort({ title: 1 });
    if (!careers || careers.length === 0) {
      careers = await CareerGoal.insertMany(CAREERS_SEED);
    }
    return careers;
  } catch {
    return CAREERS_SEED;
  }
};

/**
 * Get career details by ID
 */
const getCareerById = async (careerId) => {
  try {
    const career = await CareerGoal.findById(careerId);
    if (career) return career;
  } catch {
    // ignore
  }

  const seedMatch = CAREERS_SEED.find((c) => c.title.toLowerCase().replace(/\s+/g, "-") === careerId || c.title === careerId);
  if (seedMatch) return seedMatch;

  const err = new Error("Career goal not found.");
  err.statusCode = 404;
  throw err;
};

/**
 * Deterministically compute skill gaps & NEXORA Career Readiness Score for student
 */
const getUserCareerAnalysis = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  const targetRoleTitle = user.careerGoal?.targetRole || "Full Stack Developer";
  
  let career;
  try {
    career = await CareerGoal.findOne({ title: targetRoleTitle });
  } catch {
    // fallback
  }

  if (!career) {
    career = CAREERS_SEED.find((c) => c.title === targetRoleTitle) || CAREERS_SEED[0];
  }

  const userSkills = await UserSkill.find({ userId });
  const userSkillsMap = new Map(userSkills.map((s) => [s.skillName.toLowerCase(), s.currentLevel]));

  const requiredSkills = career ? career.requiredSkills : [];
  
  let totalRequiredPoints = 0;
  let totalAcquiredPoints = 0;

  const skillGaps = requiredSkills.map((req) => {
    const current = userSkillsMap.get(req.skillName.toLowerCase()) || 0;
    const gap = Math.max(0, req.requiredLevel - current);

    let category = "Critical";
    if (gap <= 10) {
      category = "Strong";
    } else if (gap <= 30) {
      category = "Improve";
    }

    totalRequiredPoints += req.requiredLevel;
    totalAcquiredPoints += Math.min(current, req.requiredLevel);

    return {
      skillName: req.skillName,
      requiredLevel: req.requiredLevel,
      currentLevel: current,
      gap,
      category
    };
  });

  const careerReadinessScore = totalRequiredPoints > 0 
    ? Math.round((totalAcquiredPoints / totalRequiredPoints) * 100) 
    : 0;

  return {
    targetRole: targetRoleTitle,
    targetDate: user.careerGoal?.targetDate || null,
    careerReadinessScore,
    careerDescription: career?.description || "",
    skillGaps,
    acquiredSkillsCount: skillGaps.filter((s) => s.category === "Strong").length,
    criticalGapsCount: skillGaps.filter((s) => s.category === "Critical").length
  };
};

/**
 * Update user's target career
 */
const updateUserCareer = async (userId, { targetRole, targetDate }) => {
  if (!targetRole) {
    const err = new Error("Target role is required.");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "careerGoal.targetRole": targetRole.trim(),
        "careerGoal.targetDate": targetDate ? new Date(targetDate) : null
      }
    },
    { new: true }
  );

  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return await getUserCareerAnalysis(userId);
};

module.exports = {
  getCareers,
  getCareerById,
  getUserCareerAnalysis,
  updateUserCareer
};
