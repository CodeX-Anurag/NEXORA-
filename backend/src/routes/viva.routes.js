const express = require("express");
const vivaController = require("../controllers/viva.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// All viva endpoints require authentication
router.use(authenticate);

// Start a new Socratic Viva Exam
router.post("/start", vivaController.startSession);

// Submit spoken or typed response to active round
router.post("/:id/submit", vivaController.submitAnswer);

// Get viva history for authenticated student
router.get("/history", vivaController.getHistory);

// Get specific session details
router.get("/:id", vivaController.getSessionById);

// Create study tasks from recommended revision topics
router.post("/:id/create-tasks", vivaController.convertRecommendationsToTasks);

module.exports = router;
