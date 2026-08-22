const express = require("express");
const projectController = require("../controllers/project.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/v1/projects
router.get("/", projectController.getProjects);

// POST /api/v1/projects
router.post("/", projectController.createProject);

// GET /api/v1/projects/:id
router.get("/:id", projectController.getProjectById);

// PUT /api/v1/projects/:id
router.put("/:id", projectController.updateProject);

// DELETE /api/v1/projects/:id
router.delete("/:id", projectController.deleteProject);

module.exports = router;
