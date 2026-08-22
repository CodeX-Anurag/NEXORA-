const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"]
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
      index: true
    },
    education: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ degree: "", institution: "", year: null })
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ theme: "dark", notifications: true })
    },
    careerGoal: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ targetRole: "", targetDate: null })
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
