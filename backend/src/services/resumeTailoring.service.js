/**
 * NEXORA Job Intelligence — Resume Tailoring Service
 * Bridges scraped job requirements with the user's verified ResumeProfile and multi-platform data.
 */

const resumeService = require("./resume.service");
const jobAnalysisService = require("./jobAnalysis.service");

/**
 * Tailors a candidate's resume to a specific scraped or analyzed job posting
 *
 * @param {string} userId Authenticated user's ID
 * @param {object} params
 * @param {object} params.jobRequirements The extracted or analyzed job requirements
 * @param {string} [params.targetRole] Target role override
 * @param {string} [params.targetCompany] Target company override
 * @param {string} [params.template] 'classic' | 'modern' | 'technical'
 * @param {string} [params.preferredLength] '1_page' | '2_page'
 */
const tailorResumeToJob = async (userId, params = {}) => {
  const {
    jobRequirements,
    targetRole,
    targetCompany,
    template = "modern",
    preferredLength = "1_page",
    profileOverride = null
  } = params;

  if (!jobRequirements || typeof jobRequirements !== "object") {
    const err = new Error("Job requirements data is required for tailoring.");
    err.statusCode = 400;
    throw err;
  }

  // Normalize target role and company
  const effectiveRole = targetRole || jobRequirements.jobTitle || "Software Engineer";
  const effectiveCompany = targetCompany || jobRequirements.company || "Target Company";

  // Execute Gemini-powered resume tailoring with strict non-hallucination boundaries
  const tailoringResult = await resumeService.generateTailoredResume(userId, {
    template,
    targetRole: effectiveRole,
    targetCompany: effectiveCompany,
    jobDescription: {
      jobTitle: effectiveRole,
      company: effectiveCompany,
      requiredSkills: jobRequirements.requiredSkills || [],
      preferredSkills: jobRequirements.preferredSkills || [],
      responsibilities: jobRequirements.responsibilities || [],
      qualifications: jobRequirements.qualifications || []
    },
    profileOverride,
    preferredLength
  });

  // Calculate alignment match feedback between candidate profile and tailored resume
  const matchFeedback = jobAnalysisService.compareProfileWithJob(
    tailoringResult.resumeData,
    jobRequirements
  );

  return {
    success: true,
    message: `Resume successfully tailored for ${effectiveRole} at ${effectiveCompany}.`,
    tailoredResume: tailoringResult.resumeData,
    template: tailoringResult.template || template,
    matchAnalysis: matchFeedback,
    targetJob: {
      jobTitle: effectiveRole,
      company: effectiveCompany,
      location: jobRequirements.location || "Remote / Onsite",
      jobType: jobRequirements.jobType || "Full-time",
      applicationUrl: jobRequirements.applicationUrl || ""
    }
  };
};

module.exports = {
  tailorResumeToJob
};
