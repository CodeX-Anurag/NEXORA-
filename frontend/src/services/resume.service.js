import apiClient from "./api";

/**
 * 1. Persistent Resume Profile
 */
export const getResumeProfile = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/profile", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const saveResumeProfile = async (accessToken, profileData) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(profileData)
  });
};

/**
 * 2. Document Import (PDF & DOCX)
 */
export const importResumeFile = async (accessToken, file) => {
  if (!accessToken) throw new Error("Authentication token required.");

  const formData = new FormData();
  formData.append("resume", file);

  return await apiClient("/resume/import", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData
  });
};

/**
 * 3. Job Description Research & Match Feedback
 */
export const analyzeJobDescription = async (accessToken, { jobText, jobUrl }) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/analyze-jd", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ jobText, jobUrl })
  });
};

export const getJobMatchFeedback = async (accessToken, { profileData, jobData }) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/match-feedback", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ profileData, jobData })
  });
};

/**
 * 4. Gemini Resume Generation & Section AI
 */
export const generateTailoredResume = async (accessToken, options = {}) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/generate", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(options)
  });
};

export const improveSectionAi = async (accessToken, payload) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/section-ai", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
};

/**
 * 5. Saved Resumes CRUD
 */
export const listSavedResumes = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/saved", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const getSavedResume = async (accessToken, resumeId) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient(`/resume/saved/${resumeId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const createSavedResume = async (accessToken, payload) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/saved", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
};

export const updateSavedResume = async (accessToken, resumeId, payload) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient(`/resume/saved/${resumeId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
};

export const deleteSavedResume = async (accessToken, resumeId) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient(`/resume/saved/${resumeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

/**
 * 6. Export Binary Documents (DOCX & PDF)
 */
export const downloadDocx = async (accessToken, { resumeData, template = "modern" }) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/export/docx", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ resumeData, template }),
    responseType: "blob"
  });
};

export const downloadPdf = async (accessToken, { resumeData, template = "modern" }) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/export/pdf", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ resumeData, template }),
    responseType: "blob"
  });
};

/**
 * 7. Legacy Methods (Backward Compatibility)
 */
export const getResume = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const exportResume = async (accessToken, format = "markdown") => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient(`/resume/export?format=${format}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const generateAiSummary = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/summary/ai", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const scrapeJobPosting = async (accessToken, { url, jobText }) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/jobs/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ url, jobText })
  });
};

export const tailorResumeToJob = async (accessToken, payload) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/jobs/tailor", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
};

export default {
  getResumeProfile,
  saveResumeProfile,
  importResumeFile,
  analyzeJobDescription,
  getJobMatchFeedback,
  scrapeJobPosting,
  tailorResumeToJob,
  generateTailoredResume,
  improveSectionAi,
  listSavedResumes,
  getSavedResume,
  createSavedResume,
  updateSavedResume,
  deleteSavedResume,
  downloadDocx,
  downloadPdf,
  getResume,
  exportResume,
  generateAiSummary
};
