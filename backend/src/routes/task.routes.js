const express = require("express");
const taskController = require("../controllers/task.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// All task endpoints are protected
router.use(authenticate);

// GET /api/v1/tasks
router.get("/", taskController.getTasks);

// POST /api/v1/tasks
router.post("/", taskController.createTask);

// GET /api/v1/tasks/:id
router.get("/:id", taskController.getTaskById);

// PUT /api/v1/tasks/:id
router.put("/:id", taskController.updateTask);

// DELETE /api/v1/tasks/:id
router.delete("/:id", taskController.deleteTask);

module.exports = router;
