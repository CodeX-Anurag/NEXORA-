const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    fingerprint: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Recommendation title is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Recommendation description is required"],
      trim: true
    },
    type: {
      type: String,
      enum: ["skill", "task", "project", "study", "career"],
      default: "skill"
    },
    actionableSteps: {
      type: [String],
      default: []
    },
    relevanceScore: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    feedback: {
      type: String,
      enum: ["helpful", "not_useful", "accepted", "rejected", "pending"],
      default: "pending"
    },
    status: {
      type: String,
      enum: ["active", "accepted", "rejected", "dismissed", "completed"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

recommendationSchema.index({ userId: 1, fingerprint: 1 });
recommendationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
