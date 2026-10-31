const mongoose = require("mongoose");

const educationItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    degree: { type: String, default: "", trim: true },
    fieldOfStudy: { type: String, default: "", trim: true },
    institution: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    gpa: { type: String, default: "", trim: true },
    coursework: [{ type: String, trim: true }]
  },
  { _id: false }
);

const experienceItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    title: { type: String, default: "", trim: true },
    company: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    description: { type: String, default: "", trim: true },
    bulletPoints: [{ type: String, trim: true }]
  },
  { _id: false }
);

const projectItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    techStack: [{ type: String, trim: true }],
    bulletPoints: [{ type: String, trim: true }],
    githubUrl: { type: String, default: "", trim: true },
    demoUrl: { type: String, default: "", trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" }
  },
  { _id: false }
);

const skillItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["languages", "frameworks", "tools", "databases", "soft_skills", "other"],
      default: "languages"
    },
    level: { type: Number, min: 0, max: 100, default: 75 },
    confirmed: { type: Boolean, default: true }
  },
  { _id: false }
);

const certificationItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, default: "", trim: true },
    issuer: { type: String, default: "", trim: true },
    issueDate: { type: String, default: "" },
    expiryDate: { type: String, default: "" },
    credentialId: { type: String, default: "", trim: true },
    credentialUrl: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const achievementItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    title: { type: String, default: "", trim: true },
    issuer: { type: String, default: "", trim: true },
    date: { type: String, default: "" },
    description: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const responsibilityItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    role: { type: String, default: "", trim: true },
    organization: { type: String, default: "", trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    description: { type: String, default: "", trim: true },
    bulletPoints: [{ type: String, trim: true }]
  },
  { _id: false }
);

const languageItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    language: { type: String, default: "", trim: true },
    proficiency: {
      type: String,
      enum: ["Native", "Fluent", "Professional", "Conversational", "Basic"],
      default: "Professional"
    }
  },
  { _id: false }
);

const resumeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    personalInfo: {
      fullName: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      location: { type: String, default: "", trim: true },
      linkedin: { type: String, default: "", trim: true },
      github: { type: String, default: "", trim: true },
      portfolio: { type: String, default: "", trim: true },
      website: { type: String, default: "", trim: true }
    },
    targetRole: { type: String, default: "Software Engineer", trim: true },
    professionalSummary: { type: String, default: "", trim: true },
    education: [educationItemSchema],
    skills: [skillItemSchema],
    projects: [projectItemSchema],
    experience: [experienceItemSchema],
    certifications: [certificationItemSchema],
    achievements: [achievementItemSchema],
    coursework: [{ type: String, trim: true }],
    responsibilities: [responsibilityItemSchema],
    languages: [languageItemSchema],
    lastConfirmedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

// Method to calculate completion checklist
resumeProfileSchema.methods.calculateCompletion = function () {
  const sections = {
    personalInfo: !!(this.personalInfo?.fullName && this.personalInfo?.email && this.personalInfo?.phone),
    professionalSummary: !!(this.professionalSummary && this.professionalSummary.trim().length > 20),
    education: Array.isArray(this.education) && this.education.length > 0 && !!this.education[0]?.institution,
    skills: Array.isArray(this.skills) && this.skills.length >= 3,
    projects: Array.isArray(this.projects) && this.projects.length >= 1,
    experience: Array.isArray(this.experience) && this.experience.length >= 1,
    certifications: Array.isArray(this.certifications) && this.certifications.length > 0,
    achievements: Array.isArray(this.achievements) && this.achievements.length > 0,
    responsibilities: Array.isArray(this.responsibilities) && this.responsibilities.length > 0,
    languages: Array.isArray(this.languages) && this.languages.length > 0
  };

  const completedCount = Object.values(sections).filter(Boolean).length;
  const totalCount = Object.keys(sections).length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    sections,
    completedCount,
    totalCount,
    percentage,
    isComplete: sections.personalInfo && sections.education && sections.skills && sections.projects
  };
};

module.exports = mongoose.model("ResumeProfile", resumeProfileSchema);
