const express = require("express");
const studyController = require("../controllers/study.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// All study session endpoints are protected
router.use(authenticate);

// GET /api/v1/study/sessions
router.get("/sessions", studyController.getStudySessions);

// POST /api/v1/study/sessions
router.post("/sessions", studyController.createStudySession);

// GET /api/v1/study/sessions/:id
router.get("/sessions/:id", studyController.getStudySessionById);

// DELETE /api/v1/study/sessions/:id
router.delete("/sessions/:id", studyController.deleteStudySession);

module.exports = router;
