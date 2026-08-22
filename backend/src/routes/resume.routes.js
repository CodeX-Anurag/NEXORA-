const express = require("express");
const resumeController = require("../controllers/resume.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/v1/resume — Get synthesized resume JSON representation
router.get("/", resumeController.getResume);

// GET /api/v1/resume/export — Export resume as Markdown or JSON
router.get("/export", resumeController.exportResume);

// POST /api/v1/resume/summary/ai — Generate AI-enhanced executive summary (Guarded by aiLimiter)
router.post("/summary/ai", aiLimiter, resumeController.generateAiSummary);

module.exports = router;
