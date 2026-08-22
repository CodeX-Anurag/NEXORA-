const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const analyticsFetch = async (endpoint, accessToken) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    credentials: "include"
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `API Error: Status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
};

export const analyticsService = {
  getDashboardAnalytics: async (accessToken) => {
    return await analyticsFetch("/analytics/dashboard", accessToken);
  },

  getProductivityAnalytics: async (accessToken) => {
    return await analyticsFetch("/analytics/productivity", accessToken);
  },

  getCareerAnalytics: async (accessToken) => {
    return await analyticsFetch("/analytics/career", accessToken);
  }
};

export default analyticsService;
