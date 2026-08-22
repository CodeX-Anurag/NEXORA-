const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    memory: {
      type: String,
      required: [true, "Memory content is required"],
      trim: true
    },
    type: {
      type: String,
      enum: ["long_term", "session", "preference", "career", "fact"],
      default: "long_term",
      index: true
    },
    importance: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    source: {
      type: String,
      enum: ["user_explicit", "system_extracted", "preference"],
      default: "user_explicit"
    },
    embedding: {
      type: [Number],
      default: undefined
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for user memory query performance & importance ranking
memorySchema.index({ userId: 1, type: 1 });
memorySchema.index({ userId: 1, type: 1, importance: -1 });

module.exports = mongoose.model("Memory", memorySchema);
