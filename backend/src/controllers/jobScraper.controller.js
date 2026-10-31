/**
 * NEXORA Job Intelligence Controller
 * Exposes scraping, JSON-LD/semantic HTML extraction, match analysis, and resume tailoring.
 */

const jobScraperService = require("../services/jobScraper.service");
const jobExtractionService = require("../services/jobExtraction.service");
const jobAnalysisService = require("../services/jobAnalysis.service");
const resumeTailoringService = require("../services/resumeTailoring.service");
const ResumeProfile = require("../models/ResumeProfile.model");

/**
 * POST /api/v1/jobs/scrape
 * Scrapes a public job URL or accepts pasted text, extracting the 10 core fields + applicationUrl.
 */
const scrapeJob = async (req, res, next) => {
  try {
    const { url, jobText } = req.body;

    if (!url && (!jobText || jobText.trim().length < 30)) {
      const err = new Error("Please provide a valid job URL or job description text (minimum 30 characters).");
      err.statusCode = 400;
      throw err;
    }

    let extractedData;
    let sourceUrl = url ? url.trim() : "";

    if (sourceUrl) {
      try {
        const scraped = await jobScraperService.fetchJobPage(sourceUrl);
        extractedData = jobExtractionService.extractJobData(scraped.rawHtml, sourceUrl);
      } catch (scrapeErr) {
        // If scraping failed or blocked, return graceful fallback instructions
        return res.status(scrapeErr.statusCode || 422).json({
          success: false,
          fallbackRequired: true,
          message: scrapeErr.message,
          canPaste: true
        });
      }
    } else {
      extractedData = jobExtractionService.extractJobData(jobText, "");
    }

    // Normalize and enrich extracted job fields
    const normalizedJob = await jobAnalysisService.analyzeAndNormalizeJob(extractedData);

    return res.status(200).json({
      success: true,
      message: "Job details extracted successfully.",
      extractionMethod: extractedData.extractionMethod,
      isStructured: extractedData.isStructured,
      job: normalizedJob
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/jobs/match
 * Compares job requirements against user's profile and saved projects
 */
const matchJob = async (req, res, next) => {
  try {
    const { profileData, jobRequirements } = req.body;

    if (!jobRequirements) {
      const err = new Error("Job requirements data is required for match analysis.");
      err.statusCode = 400;
      throw err;
    }

    let profile = profileData;
    if (!profile) {
      profile = await ResumeProfile.findOne({ userId: req.userId }).lean();
    }

    if (!profile) {
      const err = new Error("No profile found. Please create or confirm your profile details first.");
      err.statusCode = 400;
      err.requiresOnboarding = true;
      throw err;
    }

    const matchAnalysis = jobAnalysisService.compareProfileWithJob(profile, jobRequirements);

    return res.status(200).json({
      success: true,
      matchAnalysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/jobs/tailor
 * Generates ATS resume tailored to scraped job requirements using strictly confirmed facts
 */
const tailorResume = async (req, res, next) => {
  try {
    const result = await resumeTailoringService.tailorResumeToJob(req.userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scrapeJob,
  matchJob,
  tailorResume
};
