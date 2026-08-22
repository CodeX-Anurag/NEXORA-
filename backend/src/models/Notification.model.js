const mongoose = require("mongoose");

/**
 * Notification Schema — In-App Notifications with Database-Level Idempotency
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ["TASK_DUE_SOON", "TASK_OVERDUE", "STUDY_REMINDER", "SYSTEM_ALERT"],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    relatedEntityType: {
      type: String,
      enum: ["Task", "StudySession", "System"],
      default: "System"
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    deduplicationKey: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound Unique Index enforcing 100% Database-Level Idempotency & Deduplication
notificationSchema.index({ userId: 1, deduplicationKey: 1 }, { unique: true });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
