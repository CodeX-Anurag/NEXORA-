const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true
    },
    duration: {
      type: Number,
      required: [true, "Study duration in minutes is required"],
      min: [1, "Duration must be at least 1 minute"]
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user study history queries
studySessionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("StudySession", studySessionSchema);
