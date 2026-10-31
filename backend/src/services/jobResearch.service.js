/**
 * NEXORA Job Intelligence — Job Research Gateway Service
 * Integrates modular scraper, extraction, and analysis services while preserving backwards compatibility.
 */

const jobScraperService = require("./jobScraper.service");
const jobExtractionService = require("./jobExtraction.service");
const jobAnalysisService = require("./jobAnalysis.service");

/**
 * Validates a target URL against SSRF, unsupported protocols, and private network addresses
 */
const validateSafeUrl = (url) => jobScraperService.validateSafeUrl(url);

/**
 * Converts raw HTML into readable plain text, stripping scripts, styles, and tags
 */
const convertHtmlToPlainText = (html) => jobExtractionService.stripHtmlToPlainText(html);

/**
 * Parses JSON robustly from LLM response strings
 */
const parseLlmJson = (content) => jobAnalysisService.parseLlmJson(content);

/**
 * Safely fetches a public web page with timeouts and size limits
 */
const fetchPublicJobUrl = async (targetUrl) => {
  const scraped = await jobScraperService.fetchJobPage(targetUrl);
  return scraped.rawHtml;
};

/**
 * Analyzes raw job text or HTML into structured requirements
 */
const analyzeJobDescription = async (jobTextOrHtml, sourceUrl = "") => {
  if (!jobTextOrHtml || jobTextOrHtml.trim().length < 30) {
    const err = new Error("Job description is too brief. Please provide a more detailed job posting.");
    err.statusCode = 400;
    throw err;
  }

  // 1. Extract structured fields from HTML or plain text
  const extracted = jobExtractionService.extractJobData(jobTextOrHtml, sourceUrl);

  // 2. Normalize and enrich requirements using LLM / heuristic analysis
  const normalized = await jobAnalysisService.analyzeAndNormalizeJob(extracted);

  return {
    sourceUrl: sourceUrl || null,
    sourceType: sourceUrl ? "url_scraped" : "pasted_text",
    rawText: (extracted.jobDescription || jobTextOrHtml).slice(0, 15000),
    parsed: normalized
  };
};

/**
 * Compares user profile skills and experience against job description requirements
 */
const compareProfileWithJob = (profile, parsedJob) => {
  return jobAnalysisService.compareProfileWithJob(profile, parsedJob);
};

module.exports = {
  validateSafeUrl,
  convertHtmlToPlainText,
  parseLlmJson,
  fetchPublicJobUrl,
  analyzeJobDescription,
  compareProfileWithJob
};
