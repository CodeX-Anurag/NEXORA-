const ResponseParser = require("../ai/responseParser");

/**
 * Deterministic AI Quality Evaluator Utility
 * Evaluates non-structured text and structured JSON responses against schema contracts
 * Output Policy: Scores & Metadata ONLY (Zero prompt or response content storage)
 */

/**
 * Evaluate non-structured text responses (Chat, Streaming)
 */
const evaluateTextQuality = ({ content, minLength = 10, maxLength = 10000 }) => {
  const issues = [];
  let score = 100;

  if (!content || typeof content !== "string" || !content.trim()) {
    return {
      qualityScore: 0,
      isValidSchema: false,
      schemaCompletenessScore: 0,
      fallbackActivated: false,
      qualityIssues: ["EMPTY_RESPONSE"]
    };
  }

  const cleanText = content.trim();

  if (cleanText.length < minLength) {
    issues.push("TOO_SHORT");
    score -= 30;
  }

  if (cleanText.length > maxLength) {
    issues.push("TOO_LONG");
    score -= 20;
  }

  // Detect unparsed markdown fences or script tags
  if (cleanText.includes("```") || /<script\b/i.test(cleanText)) {
    issues.push("RAW_FORMATTING");
    score -= 15;
  }

  return {
    qualityScore: Math.max(score, 0),
    isValidSchema: true,
    schemaCompletenessScore: 1.0,
    fallbackActivated: false,
    qualityIssues: issues
  };
};

/**
 * Evaluate structured JSON responses (Roadmap, Recommendation)
 */
const evaluateStructuredQuality = ({ rawText, schemaType = "roadmap" }) => {
  const issues = [];

  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    return {
      parsedData: null,
      qualityScore: 0,
      isValidSchema: false,
      schemaCompletenessScore: 0,
      fallbackActivated: true,
      qualityIssues: ["EMPTY_RESPONSE", "FALLBACK_ACTIVATED"]
    };
  }

  let parsedData = null;

  try {
    parsedData = ResponseParser.parseJSON(rawText);
  } catch {
    return {
      parsedData: null,
      qualityScore: 40,
      isValidSchema: false,
      schemaCompletenessScore: 0,
      fallbackActivated: true,
      qualityIssues: ["MALFORMED_JSON", "FALLBACK_ACTIVATED"]
    };
  }

  try {
    if (schemaType === "roadmap") {
      ResponseParser.validateRoadmapSchema(parsedData);
    } else if (schemaType === "recommendation") {
      ResponseParser.validateRecommendationSchema(parsedData);
    }
  } catch (err) {
    return {
      parsedData,
      qualityScore: 50,
      isValidSchema: false,
      schemaCompletenessScore: 0.5,
      fallbackActivated: true,
      qualityIssues: [`INVALID_SCHEMA_${err.message.toUpperCase().replace(/[^A_Z0_9]/g, "_")}`, "FALLBACK_ACTIVATED"]
    };
  }

  return {
    parsedData,
    qualityScore: 100,
    isValidSchema: true,
    schemaCompletenessScore: 1.0,
    fallbackActivated: false,
    qualityIssues: issues
  };
};

module.exports = {
  evaluateTextQuality,
  evaluateStructuredQuality
};
