import apiClient from "./api";

/**
 * Frontend Resume Service for Substep 12C
 */
export const getResume = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export const exportResume = async (accessToken, format = "markdown") => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient(`/resume/export?format=${format}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export const generateAiSummary = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/resume/summary/ai", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export default {
  getResume,
  exportResume,
  generateAiSummary
};
