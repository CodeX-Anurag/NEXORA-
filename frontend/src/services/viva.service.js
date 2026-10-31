const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

const vivaFetch = async (endpoint, accessToken, options = {}) => {
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

export const vivaService = {
  startSession: async (accessToken, payload) => {
    return await vivaFetch("/viva/start", accessToken, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  submitAnswer: async (accessToken, sessionId, answer) => {
    return await vivaFetch(`/viva/${sessionId}/submit`, accessToken, {
      method: "POST",
      body: JSON.stringify({ answer })
    });
  },

  getHistory: async (accessToken) => {
    return await vivaFetch("/viva/history", accessToken, {
      method: "GET"
    });
  },

  getSessionById: async (accessToken, sessionId) => {
    return await vivaFetch(`/viva/${sessionId}`, accessToken, {
      method: "GET"
    });
  },

  convertRecommendationsToTasks: async (accessToken, sessionId) => {
    return await vivaFetch(`/viva/${sessionId}/create-tasks`, accessToken, {
      method: "POST"
    });
  }
};

export default vivaService;
