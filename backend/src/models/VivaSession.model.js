const mongoose = require("mongoose");

const RoundSchema = new mongoose.Schema(
  {
    roundNumber: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    studentAnswer: {
      type: String,
      trim: true,
      default: ""
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    feedback: {
      type: String,
      default: ""
    },
    strengths: {
      type: [String],
      default: []
    },
    improvements: {
      type: [String],
      default: []
    },
    keyTakeaway: {
      type: String,
      default: ""
    }
  },
  { _id: true, timestamps: true }
);

const VivaSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Easy", "Medium", "Hard"],
      default: "Intermediate"
    },
    focusArea: {
      type: String,
      trim: true,
      default: ""
    },
    language: {
      type: String,
      default: "en-US"
    },
    answerMode: {
      type: String,
      enum: ["voice", "text", "hybrid"],
      default: "hybrid"
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      index: true
    },
    currentRound: {
      type: Number,
      default: 1
    },
    maxRounds: {
      type: Number,
      default: 5
    },
    averageScore: {
      type: Number,
      default: 0
    },
    rounds: {
      type: [RoundSchema],
      default: []
    },
    summaryReport: {
      overallGrade: {
        type: String,
        default: ""
      },
      overallFeedback: {
        type: String,
        default: ""
      },
      strengthsSummary: {
        type: [String],
        default: []
      },
      recommendedTopics: {
        type: [String],
        default: []
      },
      readinessAssessment: {
        type: String,
        default: ""
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user query performance
VivaSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("VivaSession", VivaSessionSchema);
