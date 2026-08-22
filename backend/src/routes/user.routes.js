const express = require("express");
const userController = require("../controllers/user.controller");
const skillController = require("../controllers/skill.controller");
const careerController = require("../controllers/career.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Profile endpoints
router.get("/me", userController.getMeProfile);
router.put("/me", userController.updateMeProfile);
router.delete("/me", userController.deleteMeAccount);

// User skill ratings endpoints (/api/v1/users/me/skills)
router.get("/me/skills", skillController.getUserSkills);
router.post("/me/skills", skillController.addUserSkill);
router.put("/me/skills/:id", skillController.updateUserSkill);
router.delete("/me/skills/:id", skillController.deleteUserSkill);

// User career goal endpoints (/api/v1/users/me/career)
router.get("/me/career", careerController.getUserCareer);
router.put("/me/career", careerController.updateUserCareer);

module.exports = router;
