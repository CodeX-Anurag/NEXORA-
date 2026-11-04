const express = require("express");
const multer = require("multer");
const aiController = require("../controllers/ai.controller");
const { authenticate } = require("../middleware/auth.middleware");
const validateObjectId = require("../middleware/validateObjectId.middleware");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticate);

// Phase 5 & Multimodal 2.0 AI Chat Routes
router.post("/chat", aiController.chat);
router.post("/chat/stream", aiController.chatStream);

// Multimodal Endpoints: Images, Voice STT, Voice TTS, Documents
router.post("/generate-image", aiController.generateImage);
router.post("/audio/transcribe", upload.single("audio"), aiController.transcribeAudio);
router.post("/audio/synthesize", aiController.synthesizeSpeech);
router.post("/documents/upload", upload.single("file"), aiController.uploadDocument);

// Message Actions: Helpful / Not Helpful Feedback & Save/Bookmark
router.put("/messages/:id/feedback", validateObjectId("id"), aiController.submitMessageFeedback);
router.put("/messages/:id/save", validateObjectId("id"), aiController.toggleSaveMessage);

// Educational Scaffold Tools: Quiz, Flashcard & Code Review Generators
router.post("/tools/quiz", aiController.generateQuiz);
router.post("/tools/flashcards", aiController.generateFlashcards);
router.post("/tools/code-review", aiController.reviewCode);

// Phase 7 AI Intelligence & Recommendation Routes
router.post("/skill-analysis", aiController.analyzeSkillGaps);
router.post("/generate-roadmap", aiController.generateRoadmap);
router.post("/recommend", aiController.generateRecommendations);
router.get("/recommendations", aiController.getRecommendations);
router.put("/recommendations/:id/feedback", validateObjectId("id"), aiController.handleFeedback);
router.post("/recommendations/give-another", aiController.giveAnother);

module.exports = router;
