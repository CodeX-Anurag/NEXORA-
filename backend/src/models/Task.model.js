const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { _id: true }
);

const linkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

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
      enum: ["todo", "in_progress", "in_review", "completed"],
      default: "todo",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true
    },
    deadline: {
      type: Date,
      default: null,
      index: true
    },
    category: {
      type: String,
      default: "General",
      trim: true,
      index: true
    },
    estimatedMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    actualMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    subtasks: {
      type: [subtaskSchema],
      default: []
    },
    recurrence: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    // My Day Workspace persistence
    isMyDay: {
      type: Boolean,
      default: false,
      index: true
    },
    myDayDate: {
      type: Date,
      default: null
    },
    links: {
      type: [linkSchema],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    // Metadata fields for AI Roadmap & Recommendation conversion
    source: {
      type: String,
      enum: ["manual", "ai_roadmap", "ai_recommendation", "ai_breakdown"],
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual alias for dueAt <-> deadline
taskSchema.virtual("dueAt").get(function () {
  return this.deadline;
}).set(function (val) {
  this.deadline = val;
});

// Calculate completion progress helper
taskSchema.virtual("progress").get(function () {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === "completed" ? 100 : 0;
  }
  const completedCount = this.subtasks.filter((st) => st.completed).length;
  return Math.round((completedCount / this.subtasks.length) * 100);
});

// Compound indexes for query performance & sorting
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, status: 1, deadline: 1 });
taskSchema.index({ userId: 1, isMyDay: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, deduplicationKey: 1 });

module.exports = mongoose.model("Task", taskSchema);
