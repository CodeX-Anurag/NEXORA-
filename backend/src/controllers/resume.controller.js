const resumeService = require("../services/resume.service");
const resumeImportService = require("../services/resumeImport.service");
const jobResearchService = require("../services/jobResearch.service");

/**
 * 1. Resume Profile Controllers
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await resumeService.getResumeProfile(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const saveProfile = async (req, res, next) => {
  try {
    const result = await resumeService.saveResumeProfile(req.userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Resume Document Import (PDF & DOCX)
 */
const importResume = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("No resume file uploaded. Please upload a PDF or DOCX document.");
      err.statusCode = 400;
      throw err;
    }

    const extractedText = await resumeImportService.extractTextFromResumeBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    const parsedData = await resumeImportService.parseResumeTextWithAi(extractedText);

    return res.status(200).json({
      success: true,
      message: "Resume imported and parsed successfully. Please review before applying.",
      fileName: req.file.originalname,
      extractedTextLength: extractedText.length,
      extractedData: parsedData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Job Description Analysis & Web Scraping
 */
const analyzeJob = async (req, res, next) => {
  try {
    const { jobText, jobUrl } = req.body;
    let contentToAnalyze = jobText || "";

    if (jobUrl) {
      try {
        contentToAnalyze = await jobResearchService.fetchPublicJobUrl(jobUrl);
      } catch (scrapeErr) {
        // If scraping is blocked, return graceful fallback instructions
        return res.status(scrapeErr.statusCode || 422).json({
          success: false,
          fallbackRequired: true,
          message: scrapeErr.message,
          canPaste: true
        });
      }
    }

    if (!contentToAnalyze || contentToAnalyze.trim().length < 30) {
      const err = new Error("Please provide job description text or a valid public job posting URL.");
      err.statusCode = 400;
      throw err;
    }

    const analysisResult = await jobResearchService.analyzeJobDescription(contentToAnalyze, jobUrl);

    return res.status(200).json({
      success: true,
      jobAnalysis: analysisResult
    });
  } catch (error) {
    next(error);
  }
};

const matchFeedback = async (req, res, next) => {
  try {
    const { profileData, jobData } = req.body;
    if (!profileData || !jobData) {
      const err = new Error("Both profileData and jobData are required for match analysis.");
      err.statusCode = 400;
      throw err;
    }

    const analysis = jobResearchService.compareProfileWithJob(profileData, jobData);
    return res.status(200).json({
      success: true,
      matchAnalysis: analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Gemini-Powered Tailored Resume Generation
 */
const generateTailoredResume = async (req, res, next) => {
  try {
    const result = await resumeService.generateTailoredResume(req.userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const improveSection = async (req, res, next) => {
  try {
    const result = await resumeService.improveSectionAi(req.userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Saved Resumes CRUD
 */
const listSavedResumes = async (req, res, next) => {
  try {
    const result = await resumeService.listSavedResumes(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getSavedResume = async (req, res, next) => {
  try {
    const result = await resumeService.getSavedResume(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createSavedResume = async (req, res, next) => {
  try {
    const result = await resumeService.createSavedResume(req.userId, req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateSavedResume = async (req, res, next) => {
  try {
    const result = await resumeService.updateSavedResume(req.userId, req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteSavedResume = async (req, res, next) => {
  try {
    const result = await resumeService.deleteSavedResume(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Export Handlers (Binary DOCX & PDF)
 */
const exportDocx = async (req, res, next) => {
  try {
    let { resumeData, template = "modern" } = req.body;

    if (!resumeData) {
      const profile = await resumeService.getResumeProfile(req.userId);
      resumeData = profile.profile;
    }

    const docxBuffer = await resumeService.exportResumeDocx(resumeData, template);
    const candidateName = (resumeData.personalInfo?.fullName || resumeData.personalInfo?.name || "Student").replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${candidateName}_Resume.docx"`);
    res.setHeader("Content-Length", docxBuffer.length);
    return res.end(docxBuffer);
  } catch (error) {
    next(error);
  }
};

const exportPdf = async (req, res, next) => {
  try {
    let { resumeData, template = "modern" } = req.body;

    if (!resumeData) {
      const profile = await resumeService.getResumeProfile(req.userId);
      resumeData = profile.profile;
    }

    const pdfBuffer = await resumeService.exportResumePdf(resumeData, template);
    const candidateName = (resumeData.personalInfo?.fullName || resumeData.personalInfo?.name || "Student").replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${candidateName}_Resume.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Legacy Controllers (Backward Compatibility)
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

const generateAiSummary = async (req, res, next) => {
  try {
    const result = await resumeService.generateAiSummary(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  saveProfile,
  importResume,
  analyzeJob,
  matchFeedback,
  generateTailoredResume,
  improveSection,
  listSavedResumes,
  getSavedResume,
  createSavedResume,
  updateSavedResume,
  deleteSavedResume,
  exportDocx,
  exportPdf,
  getResume,
  exportResume,
  generateAiSummary
};
