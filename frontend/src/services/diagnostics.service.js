import apiClient from "./api";

/**
 * Diagnostics Service for fetching system telemetry & health diagnostics
 */
export const getDiagnostics = async (accessToken) => {
  if (!accessToken) {
    throw new Error("Authentication token required for system diagnostics.");
  }

  return await apiClient("/health/diagnostics", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export default {
  getDiagnostics
};
