const express = require("express");
const skillController = require("../controllers/skill.controller");

const router = express.Router();

// GET /api/v1/skills (public catalog)
router.get("/", skillController.getSkillCatalog);

module.exports = router;
