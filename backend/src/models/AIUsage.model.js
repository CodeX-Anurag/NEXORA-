const mongoose = require("mongoose");

/**
 * AIUsage Schema — Persists non-sensitive AI usage metrics, estimated costs, execution latencies, and quality signals.
 * Storage Policy: Metadata ONLY (Zero prompts, response text, or private user contents).
 */
const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true,
      enum: ["openai", "mock"],
      default: "mock"
    },
    model: {
      type: String,
      required: true,
      default: "mock-model"
    },
    operation: {
      type: String,
      required: true,
      enum: [
        "chat",
        "stream",
        "skill_analysis",
        "roadmap",
        "recommendation",
        "embedding"
      ],
      index: true
    },
    endpoint: {
      type: String,
      required: true
    },
    promptTokens: {
      type: Number,
      default: 0
    },
    completionTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    success: {
      type: Boolean,
      default: true,
      index: true
    },
    errorCategory: {
      type: String,
      default: null
    },

    // Substep 11D — Quality Evaluation & Fallback Telemetry Fields
    qualityScore: {
      type: Number,
      default: 100
    },
    isValidSchema: {
      type: Boolean,
      default: true
    },
    schemaCompletenessScore: {
      type: Number,
      default: 1.0
    },
    fallbackActivated: {
      type: Boolean,
      default: false
    },
    qualityIssues: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound indexes for user telemetry and provider performance queries
aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ provider: 1, createdAt: -1 });

module.exports = mongoose.model("AIUsage", aiUsageSchema);
