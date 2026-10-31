/**
 * NEXORA Job Intelligence Routes
 * Mounted at /api/v1/jobs
 */

const express = require("express");
const jobScraperController = require("../controllers/jobScraper.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// Require authentication for all job intelligence actions
router.use(authenticate);

// 1. Scrape & Extract Job (Public URL or pasted text)
router.post("/scrape", aiLimiter, jobScraperController.scrapeJob);

// 2. Profile vs Job Matching Engine
router.post("/match", jobScraperController.matchJob);

// 3. Tailor Resume to Job Requirements (LLM-powered)
router.post("/tailor", aiLimiter, jobScraperController.tailorResume);

module.exports = router;
