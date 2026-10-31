const express = require("express");
const resumeController = require("../controllers/resume.controller");
const resumeImportService = require("../services/resumeImport.service");
const { authenticate } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// All resume routes require authentication
router.use(authenticate);

// 1. Persistent Resume Profile
router.get("/profile", resumeController.getProfile);
router.put("/profile", resumeController.saveProfile);

// 2. Import PDF/DOCX Resume (Multipart upload, 5MB limit)
router.post(
  "/import",
  (req, res, next) => {
    resumeImportService.upload.single("resume")(req, res, (err) => {
      if (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  },
  resumeController.importResume
);

// 3. Job Description Research & Web Scraping (Guarded by aiLimiter)
router.post("/analyze-jd", aiLimiter, resumeController.analyzeJob);
router.post("/match-feedback", resumeController.matchFeedback);

// 4. Gemini Resume Generation & Section AI (Guarded by aiLimiter)
router.post("/generate", aiLimiter, resumeController.generateTailoredResume);
router.post("/section-ai", aiLimiter, resumeController.improveSection);

// 5. Saved Resumes Management
router.get("/saved", resumeController.listSavedResumes);
router.post("/saved", resumeController.createSavedResume);
router.get("/saved/:id", resumeController.getSavedResume);
router.put("/saved/:id", resumeController.updateSavedResume);
router.delete("/saved/:id", resumeController.deleteSavedResume);

// 6. Binary Export (DOCX & PDF)
router.post("/export/docx", resumeController.exportDocx);
router.post("/export/pdf", resumeController.exportPdf);

// 7. Backward Compatible Legacy Routes
router.get("/", resumeController.getResume);
router.get("/export", resumeController.exportResume);
router.post("/summary/ai", aiLimiter, resumeController.generateAiSummary);

module.exports = router;
