const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    techStack: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ["planned", "in_progress", "completed"],
      default: "in_progress"
    },
    githubUrl: {
      type: String,
      default: "",
      trim: true
    },
    demoUrl: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for portfolio query sorting
projectSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
