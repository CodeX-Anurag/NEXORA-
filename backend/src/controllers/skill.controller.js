const skillService = require("../services/skill.service");

const getSkillCatalog = async (_req, res, next) => {
  try {
    const skills = await skillService.getSkillCatalog();
    return res.status(200).json({ success: true, skills });
  } catch (error) {
    next(error);
  }
};

const getUserSkills = async (req, res, next) => {
  try {
    const userSkills = await skillService.getUserSkills(req.userId);
    return res.status(200).json({ success: true, skills: userSkills });
  } catch (error) {
    next(error);
  }
};

const addUserSkill = async (req, res, next) => {
  try {
    const userSkill = await skillService.addUserSkill(req.userId, req.body);
    return res.status(201).json({ success: true, message: "Skill rating saved.", skill: userSkill });
  } catch (error) {
    next(error);
  }
};

const updateUserSkill = async (req, res, next) => {
  try {
    const userSkill = await skillService.updateUserSkill(req.userId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Skill rating updated.", skill: userSkill });
  } catch (error) {
    next(error);
  }
};

const deleteUserSkill = async (req, res, next) => {
  try {
    const result = await skillService.deleteUserSkill(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSkillCatalog,
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill
};
