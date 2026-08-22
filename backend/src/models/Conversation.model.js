const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      default: "New AI Coach Session",
      trim: true
    },
    isFreshChat: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user chat history sorting
conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
