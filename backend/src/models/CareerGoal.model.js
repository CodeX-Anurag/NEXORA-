const mongoose = require("mongoose");

const requiredSkillSchema = new mongoose.Schema(
  {
    skillName: { type: String, required: true },
    requiredLevel: { type: Number, required: true, min: 0, max: 100 }
  },
  { _id: false }
);

const careerGoalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Career title is required"],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    requiredSkills: [requiredSkillSchema],
    roadmapMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ stages: [] })
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("CareerGoal", careerGoalSchema);
