const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true
    },
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        mimeType: { type: String, trim: true },
        size: { type: Number, default: 0 }
      }
    ],
    metadata: {
      responseMode: { type: String, default: "detailed" },
      chartSpec: { type: mongoose.Schema.Types.Mixed, default: null },
      imagePrompt: { type: String, default: null },
      imageUrl: { type: String, default: null },
      toolType: { type: String, default: null },
      isError: { type: Boolean, default: false }
    },
    feedback: {
      type: String,
      enum: ["helpful", "not_useful", null],
      default: null
    },
    saved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
