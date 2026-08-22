const express = require("express");
const router = express.Router();
const memoryController = require("../controllers/memory.controller");
const { authenticate } = require("../middleware/auth.middleware");
const validateObjectId = require("../middleware/validateObjectId.middleware");

// Require authentication for all memory routes
router.use(authenticate);

router.get("/", memoryController.getMemories);
router.post("/", memoryController.createMemory);
router.put("/:id", validateObjectId("id"), memoryController.updateMemory);
router.delete("/:id", validateObjectId("id"), memoryController.deleteMemory);
router.delete("/", memoryController.deleteAllMemories);

module.exports = router;
