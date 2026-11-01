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
    credentials: "include", // Send httpOnly cookies for sessions & CORS
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

    let data;
    try {
      data = await response.json();
    } catch {
      data = { message: `Server returned HTTP ${response.status} (${response.statusText || "Unknown"})` };
    }

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

// Shortcut helper methods for uniform REST calling
apiClient.get = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: "GET" });
apiClient.post = (endpoint, body, options = {}) =>
  apiClient(endpoint, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
apiClient.put = (endpoint, body, options = {}) =>
  apiClient(endpoint, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
apiClient.patch = (endpoint, body, options = {}) =>
  apiClient(endpoint, {
    ...options,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
apiClient.delete = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: "DELETE" });

export default apiClient;
