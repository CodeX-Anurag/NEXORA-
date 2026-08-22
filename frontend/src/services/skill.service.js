const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const skillFetch = async (endpoint, accessToken, options = {}) => {
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

export const skillService = {
  getSkillCatalog: async () => {
    return await skillFetch("/skills", null, { method: "GET" });
  },

  getUserSkills: async (accessToken) => {
    return await skillFetch("/users/me/skills", accessToken, { method: "GET" });
  },

  addUserSkill: async (accessToken, skillData) => {
    return await skillFetch("/users/me/skills", accessToken, {
      method: "POST",
      body: JSON.stringify(skillData)
    });
  },

  updateUserSkill: async (accessToken, skillId, updateData) => {
    return await skillFetch(`/users/me/skills/${skillId}`, accessToken, {
      method: "PUT",
      body: JSON.stringify(updateData)
    });
  },

  deleteUserSkill: async (accessToken, skillId) => {
    return await skillFetch(`/users/me/skills/${skillId}`, accessToken, { method: "DELETE" });
  }
};

export default skillService;
