const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true
    },
    deadline: {
      type: Date,
      default: null
    },
    // Substep 12B Metadata fields for AI Roadmap & Recommendation conversion
    source: {
      type: String,
      enum: ["manual", "ai_roadmap", "ai_recommendation"],
      default: "manual",
      index: true
    },
    roadmapRole: {
      type: String,
      default: "",
      trim: true
    },
    roadmapStage: {
      type: String,
      default: "",
      trim: true
    },
    deduplicationKey: {
      type: String,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for query performance & sorting
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, deduplicationKey: 1 });

module.exports = mongoose.model("Task", taskSchema);
