const express = require("express");
const taskController = require("../controllers/task.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// All task endpoints are protected
router.use(authenticate);

// 1. Task Analytics
router.get("/analytics", taskController.getAnalytics);

// 2. AI Intelligence Task Endpoints
router.post("/ai/breakdown", aiLimiter, taskController.aiBreakdown);
router.post("/ai/daily-plan", aiLimiter, taskController.aiDailyPlan);
router.get("/ai/risk-detection", taskController.aiRiskDetection);
router.post("/:id/ai/smart-reschedule", aiLimiter, taskController.aiSmartReschedule);

// 3. Subtasks Endpoints
router.post("/:id/subtasks", taskController.addSubtask);
router.patch("/:id/subtasks/:subtaskId", taskController.toggleSubtask);
router.delete("/:id/subtasks/:subtaskId", taskController.deleteSubtask);

// 4. Focus Session & My Day Endpoints
router.post("/:id/focus-session", taskController.recordFocusSession);
router.patch("/:id/my-day", taskController.toggleMyDay);

// 5. Core CRUD Endpoints
router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.get("/:id", taskController.getTaskById);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
