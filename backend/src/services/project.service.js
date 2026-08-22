const Project = require("../models/Project.model");

/**
 * Get user projects with optional status filter and pagination
 */
const getProjects = async (userId, query = {}) => {
  const page = parseInt(query.page || "1", 10);
  const limit = Math.min(parseInt(query.limit || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter = { userId };

  if (query.status) {
    filter.status = query.status;
  }

  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(filter)
  ]);

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Create project for authenticated user
 */
const createProject = async (userId, projectData) => {
  if (!projectData.title) {
    const err = new Error("Project title is required.");
    err.statusCode = 400;
    throw err;
  }

  let techStackArray = [];
  if (Array.isArray(projectData.techStack)) {
    techStackArray = projectData.techStack;
  } else if (typeof projectData.techStack === "string") {
    techStackArray = projectData.techStack.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const project = await Project.create({
    userId,
    title: projectData.title.trim(),
    description: projectData.description || "",
    techStack: techStackArray,
    status: projectData.status || "in_progress",
    githubUrl: projectData.githubUrl || "",
    demoUrl: projectData.demoUrl || ""
  });

  return project;
};

/**
 * Get project by ID
 */
const getProjectById = async (userId, projectId) => {
  const project = await Project.findOne({ _id: projectId, userId }).lean();
  if (!project) {
    const err = new Error("Project not found.");
    err.statusCode = 404;
    throw err;
  }
  return project;
};

/**
 * Update project by ID
 */
const updateProject = async (userId, projectId, updateData) => {
  const allowedUpdates = ["title", "description", "techStack", "status", "githubUrl", "demoUrl"];
  const updates = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      if (key === "techStack") {
        if (Array.isArray(updateData.techStack)) {
          updates.techStack = updateData.techStack;
        } else if (typeof updateData.techStack === "string") {
          updates.techStack = updateData.techStack.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else {
        updates[key] = updateData[key];
      }
    }
  }

  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!project) {
    const err = new Error("Project not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  return project;
};

/**
 * Delete project by ID
 */
const deleteProject = async (userId, projectId) => {
  const project = await Project.findOneAndDelete({ _id: projectId, userId });
  if (!project) {
    const err = new Error("Project not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  return { success: true, message: "Project deleted successfully." };
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
};
