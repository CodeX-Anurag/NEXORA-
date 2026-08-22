const express = require("express");
const aiController = require("../controllers/ai.controller");
const { authenticate } = require("../middleware/auth.middleware");
const validateObjectId = require("../middleware/validateObjectId.middleware");

const router = express.Router();

router.use(authenticate);

// Phase 5 AI Chat Route (Normal JSON)
router.post("/chat", aiController.chat);

// Phase 8C SSE Backend Streaming Route
router.post("/chat/stream", aiController.chatStream);

// Phase 7 AI Intelligence & Recommendation Routes
router.post("/skill-analysis", aiController.analyzeSkillGaps);
router.post("/generate-roadmap", aiController.generateRoadmap);
router.post("/recommend", aiController.generateRecommendations);
router.get("/recommendations", aiController.getRecommendations);
router.put("/recommendations/:id/feedback", validateObjectId("id"), aiController.handleFeedback);
router.post("/recommendations/give-another", aiController.giveAnother);

module.exports = router;
