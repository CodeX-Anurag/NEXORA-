const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required"],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["Frontend", "Backend", "Database", "Language", "DevOps", "Computer Science", "General"],
      default: "General"
    },
    description: {
      type: String,
      default: ""
    },
    defaultRequiredLevel: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Skill", skillSchema);
