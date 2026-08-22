const resumeService = require("../services/resume.service");

/**
 * Get synthesized resume JSON representation for authenticated user
 */
const getResume = async (req, res, next) => {
  try {
    const resumeData = await resumeService.generateResumeData(req.userId);
    return res.status(200).json({
      success: true,
      resume: resumeData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export resume in JSON or Markdown format
 */
const exportResume = async (req, res, next) => {
  try {
    const format = (req.query.format || "markdown").toLowerCase();

    if (format === "json") {
      const resumeData = await resumeService.generateResumeData(req.userId);
      return res.status(200).json({
        success: true,
        format: "json",
        export: resumeData
      });
    }

    const markdown = await resumeService.generateResumeMarkdown(req.userId);
    return res.status(200).json({
      success: true,
      format: "markdown",
      export: markdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate AI-enhanced executive summary
 */
const generateAiSummary = async (req, res, next) => {
  try {
    const result = await resumeService.generateAiSummary(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResume,
  exportResume,
  generateAiSummary
};
