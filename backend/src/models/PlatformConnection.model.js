const mongoose = require("mongoose");

const selectedProjectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    techStack: [{ type: String, trim: true }],
    url: { type: String, default: "", trim: true },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    bulletPoints: [{ type: String, trim: true }],
    selectedForResume: { type: Boolean, default: true }
  },
  { _id: false }
);

const platformConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    platform: {
      type: String,
      required: true,
      enum: ["github", "leetcode", "codeforces", "linkedin", "portfolio", "hackerrank", "kaggle"]
    },
    username: {
      type: String,
      default: "",
      trim: true
    },
    profileUrl: {
      type: String,
      default: "",
      trim: true
    },
    connectionStatus: {
      type: String,
      enum: ["connected", "syncing", "error", "disconnected"],
      default: "connected"
    },
    verificationStatus: {
      type: String,
      enum: ["api_verified", "user_confirmed", "unverified"],
      default: "api_verified"
    },
    retrievalMethod: {
      type: String,
      enum: ["official_api", "public_graphql", "user_input", "portfolio_crawl"],
      default: "official_api"
    },
    summary: {
      primaryMetric: { type: String, default: "" },
      secondaryMetric: { type: String, default: "" },
      headline: { type: String, default: "" },
      avatarUrl: { type: String, default: "" }
    },
    importedData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    selectedItems: [selectedProjectSchema],
    lastSyncedAt: {
      type: Date,
      default: Date.now
    },
    syncError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring a user has at most one connection record per platform
platformConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model("PlatformConnection", platformConnectionSchema);
