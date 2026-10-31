const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

/**
 * Centralized API client wrapper using standard fetch.
 * Provides uniform error handling and JSON parsing.
 */
export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    if (options.responseType === "blob") {
      if (!response.ok) {
        let errMessage = `API Error: Status ${response.status}`;
        try {
          const errData = await response.json();
          errMessage = errData.message || errMessage;
        } catch {
          // ignore
        }
        const error = new Error(errMessage);
        error.status = response.status;
        throw error;
      }
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || `API Error: Status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (import.meta.env.MODE !== "test") {
      console.error(`[API Client Error] Request failed for ${endpoint}:`, error.message);
    }
    throw error;
  }
};

export default apiClient;
