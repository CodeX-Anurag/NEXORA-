const mongoose = require("mongoose");

const savedResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Resume title is required"],
      trim: true,
      default: "Untitled Resume"
    },
    targetRole: {
      type: String,
      default: "Software Engineer",
      trim: true
    },
    targetCompany: {
      type: String,
      default: "",
      trim: true
    },
    template: {
      type: String,
      enum: ["classic", "modern", "technical"],
      default: "modern"
    },
    resumeData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    jobDescription: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    matchAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

savedResumeSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("SavedResume", savedResumeSchema);
