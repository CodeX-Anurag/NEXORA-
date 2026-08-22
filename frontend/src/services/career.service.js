const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

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
  }
};

export default careerService;
