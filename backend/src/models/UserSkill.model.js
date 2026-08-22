const mongoose = require("mongoose");

const userSkillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    skillName: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true
    },
    currentLevel: {
      type: Number,
      required: [true, "Current level (0-100) is required"],
      min: [0, "Level cannot be less than 0"],
      max: [100, "Level cannot exceed 100"]
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique skill per user
userSkillSchema.index({ userId: 1, skillName: 1 }, { unique: true });

module.exports = mongoose.model("UserSkill", userSkillSchema);
