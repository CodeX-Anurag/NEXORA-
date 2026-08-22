const express = require("express");
const conversationController = require("../controllers/conversation.controller");
const { authenticate } = require("../middleware/auth.middleware");
const validateObjectId = require("../middleware/validateObjectId.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/v1/conversations
router.get("/", conversationController.getConversations);

// POST /api/v1/conversations
router.post("/", conversationController.createConversation);

// GET /api/v1/conversations/:id/messages
router.get("/:id/messages", validateObjectId("id"), conversationController.getMessages);

// POST /api/v1/conversations/:id/messages
router.post("/:id/messages", validateObjectId("id"), conversationController.addMessage);

module.exports = router;
