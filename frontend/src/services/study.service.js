const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const studyFetch = async (endpoint, accessToken, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers, credentials: "include" });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `API Error: Status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const studyService = {
  getStudySessions: async (accessToken, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/study/sessions${query ? `?${query}` : ""}`;
    return await studyFetch(endpoint, accessToken, { method: "GET" });
  },

  createStudySession: async (accessToken, sessionData) => {
    return await studyFetch("/study/sessions", accessToken, {
      method: "POST",
      body: JSON.stringify(sessionData)
    });
  },

  getStudySessionById: async (accessToken, sessionId) => {
    return await studyFetch(`/study/sessions/${sessionId}`, accessToken, { method: "GET" });
  },

  deleteStudySession: async (accessToken, sessionId) => {
    return await studyFetch(`/study/sessions/${sessionId}`, accessToken, { method: "DELETE" });
  }
};

export default studyService;
