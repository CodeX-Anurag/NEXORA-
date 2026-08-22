import apiClient from "./api";

/**
 * Health Service for checking backend REST API status
 */
export const checkHealth = async () => {
  return await apiClient("/health");
};

export default {
  checkHealth
};
