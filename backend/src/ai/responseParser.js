/**
 * Response Parser: Sanitizes, normalizes, and strictly validates LLM responses
 */
class ResponseParser {
  static parse(responsePayload) {
    if (!responsePayload || typeof responsePayload.content !== "string") {
      throw new Error("Invalid model response received from provider.");
    }

    // Strip any raw dangerous script tags from response text
    let cleanContent = responsePayload.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .trim();

    if (!cleanContent) {
      cleanContent = "I apologize, but I could not generate a valid response. Please try asking again.";
    }

    return {
      content: cleanContent,
      usage: responsePayload.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      provider: responsePayload.provider || "unknown",
      model: responsePayload.model || "unknown"
    };
  }

  /**
   * Safely extracts & parses JSON from raw LLM text (handling markdown ```json blocks)
   */
  static parseJSON(rawText) {
    if (!rawText || typeof rawText !== "string") {
      throw new Error("Invalid raw LLM output format for JSON parsing.");
    }

    let cleaned = rawText.trim();
    
    // Remove markdown code fences if present
    if (cleaned.includes("```json")) {
      cleaned = cleaned.split("```json")[1].split("```")[0].trim();
    } else if (cleaned.includes("```")) {
      cleaned = cleaned.split("```")[1].split("```")[0].trim();
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      throw new Error(`Failed to parse LLM response as JSON: ${err.message}`);
    }
  }

  /**
   * Strictly validates Career Roadmap JSON schema
   */
  static validateRoadmapSchema(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid roadmap structure: root must be an object.");
    }

    if (!data.career || typeof data.career !== "string") {
      throw new Error("Invalid roadmap schema: missing or invalid 'career' string.");
    }

    if (!Array.isArray(data.stages) || data.stages.length === 0) {
      throw new Error("Invalid roadmap schema: 'stages' must be a non-empty array.");
    }

    for (let i = 0; i < data.stages.length; i++) {
      const stage = data.stages[i];
      if (!stage.title || typeof stage.title !== "string") {
        throw new Error(`Invalid roadmap stage [${i}]: missing 'title' string.`);
      }
      if (!Array.isArray(stage.skills)) {
        throw new Error(`Invalid roadmap stage [${i}]: 'skills' must be an array.`);
      }
      if (!Array.isArray(stage.actions)) {
        throw new Error(`Invalid roadmap stage [${i}]: 'actions' must be an array.`);
      }
    }

    return true;
  }

  /**
   * Strictly validates Recommendation JSON schema
   */
  static validateRecommendationSchema(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid recommendation structure: root must be an object.");
    }

    if (!data.title || typeof data.title !== "string") {
      throw new Error("Invalid recommendation schema: missing 'title' string.");
    }

    if (!data.description || typeof data.description !== "string") {
      throw new Error("Invalid recommendation schema: missing 'description' string.");
    }

    const validTypes = ["skill", "task", "project", "study", "career"];
    if (data.type && !validTypes.includes(data.type)) {
      data.type = "skill";
    }

    if (data.actionableSteps && !Array.isArray(data.actionableSteps)) {
      data.actionableSteps = [];
    }

    return true;
  }
}

module.exports = ResponseParser;
