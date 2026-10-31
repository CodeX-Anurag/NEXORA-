import apiClient from "./api";

/**
 * Scrapes a public job URL or analyzes pasted text
 */
export const scrapeJobPosting = async (accessToken, { url, jobText }) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/jobs/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ url, jobText })
  });
};

/**
 * Evaluates skill match between confirmed profile and job requirements
 */
export const matchJobRequirements = async (accessToken, { profileData, jobRequirements }) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/jobs/match", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ profileData, jobRequirements })
  });
};

/**
 * Tailors user resume to scraped job requirements
 */
export const tailorResumeToJob = async (accessToken, payload) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/jobs/tailor", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
};

export default {
  scrapeJobPosting,
  matchJobRequirements,
  tailorResumeToJob
};
