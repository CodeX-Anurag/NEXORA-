const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

const careerFetch = async (endpoint, accessToken, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers, credentials: "include" });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `API Error: Status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
};

export const careerService = {
  getCareers: async () => {
    return await careerFetch("/careers", null, { method: "GET" });
  },

  getCareerById: async (careerId) => {
    return await careerFetch(`/careers/${careerId}`, null, { method: "GET" });
  },

  getUserCareer: async (accessToken) => {
    return await careerFetch("/users/me/career", accessToken, { method: "GET" });
  },

  updateUserCareer: async (accessToken, careerData) => {
    return await careerFetch("/users/me/career", accessToken, {
      method: "PUT",
      body: JSON.stringify(careerData)
    });
  },

  // Career Intelligence Multi-Platform Connectors
  getPlatforms: async (accessToken) => {
    return await careerFetch("/career/platforms", accessToken, { method: "GET" });
  },

  connectPlatform: async (accessToken, platform, payload) => {
    return await careerFetch(`/career/platforms/${platform}/connect`, accessToken, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  refreshPlatform: async (accessToken, platform, payload = {}) => {
    return await careerFetch(`/career/platforms/${platform}/refresh`, accessToken, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  disconnectPlatform: async (accessToken, platform) => {
    return await careerFetch(`/career/platforms/${platform}`, accessToken, {
      method: "DELETE"
    });
  },

  updateSelectedItems: async (accessToken, platform, selectedItems) => {
    return await careerFetch(`/career/platforms/${platform}/selected`, accessToken, {
      method: "PUT",
      body: JSON.stringify({ selectedItems })
    });
  },

  syncProjectsToNexora: async (accessToken) => {
    return await careerFetch("/career/platforms/sync/projects", accessToken, {
      method: "POST"
    });
  },

  syncToResumeProfile: async (accessToken) => {
    return await careerFetch("/career/platforms/sync/resume", accessToken, {
      method: "POST"
    });
  }
};

export default careerService;
