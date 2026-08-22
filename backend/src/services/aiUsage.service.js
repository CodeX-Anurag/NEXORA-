const AIUsage = require("../models/AIUsage.model");

/**
 * Estimated model pricing table in USD per 1,000 tokens
 */
const MODEL_PRICING = {
  "gpt-4o-mini": {
    inputPer1k: 0.00015,
    outputPer1k: 0.0006
  },
  "gpt-4o": {
    inputPer1k: 0.0025,
    outputPer1k: 0.01
  },
  "text-embedding-3-small": {
    inputPer1k: 0.00002,
    outputPer1k: 0
  },
  "mock-model": {
    inputPer1k: 0,
    outputPer1k: 0
  }
};

/**
 * Calculates estimated USD cost for a given model and token count
 */
const calculateEstimatedCost = (modelName, promptTokens = 0, completionTokens = 0) => {
  const rates = MODEL_PRICING[modelName] || { inputPer1k: 0, outputPer1k: 0 };
  const inputCost = (promptTokens / 1000) * rates.inputPer1k;
  const outputCost = (completionTokens / 1000) * rates.outputPer1k;
  return parseFloat((inputCost + outputCost).toFixed(8));
};

/**
 * Centralized Usage & Quality Telemetry Recording Helper
 * Swallows telemetry errors so primary AI features NEVER fail due to logging errors.
 */
const recordUsage = async ({
  userId,
  provider = "mock",
  model = "mock-model",
  operation,
  endpoint,
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0,
  latencyMs = 0,
  success = true,
  errorCategory = null,
  // Substep 11D Quality Evaluation Signals
  qualityScore = 100,
  isValidSchema = true,
  schemaCompletenessScore = 1.0,
  fallbackActivated = false,
  qualityIssues = []
}) => {
  if (!userId || !operation || !endpoint) {
    return null;
  }

  try {
    const computedTotalTokens = totalTokens || (promptTokens + completionTokens);
    const estimatedCost = calculateEstimatedCost(model, promptTokens, completionTokens);

    const doc = await AIUsage.create({
      userId,
      provider,
      model,
      operation,
      endpoint,
      promptTokens,
      completionTokens,
      totalTokens: computedTotalTokens,
      estimatedCost,
      latencyMs,
      success,
      errorCategory,
      qualityScore,
      isValidSchema,
      schemaCompletenessScore,
      fallbackActivated,
      qualityIssues
    });

    return doc;
  } catch (err) {
    console.warn(`[AI Usage Telemetry Warning] Failed to log usage: ${err.message}`);
    return null;
  }
};

/**
 * Get AI Usage & Quality metrics for authenticated user
 */
const getUserUsageMetrics = async (userId) => {
  const records = await AIUsage.find({ userId }).sort({ createdAt: -1 });

  let totalTokens = 0;
  let totalCost = 0;
  let totalLatency = 0;
  let totalQualityScore = 0;
  let fallbackCount = 0;
  let schemaValidationFailures = 0;

  for (const record of records) {
    totalTokens += record.totalTokens || 0;
    totalCost += record.estimatedCost || 0;
    totalLatency += record.latencyMs || 0;
    totalQualityScore += typeof record.qualityScore === "number" ? record.qualityScore : 100;

    if (record.fallbackActivated) fallbackCount += 1;
    if (record.isValidSchema === false) schemaValidationFailures += 1;
  }

  const count = records.length;
  const averageLatencyMs = count > 0 ? Math.round(totalLatency / count) : 0;
  const averageQualityScore = count > 0 ? parseFloat((totalQualityScore / count).toFixed(1)) : 100;

  return {
    totalRequests: count,
    totalTokens,
    totalEstimatedCost: parseFloat(totalCost.toFixed(6)),
    averageLatencyMs,
    averageQualityScore,
    fallbackCount,
    schemaValidationFailures,
    records
  };
};

module.exports = {
  calculateEstimatedCost,
  recordUsage,
  getUserUsageMetrics,
  MODEL_PRICING
};
