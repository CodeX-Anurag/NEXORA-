const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const projectFetch = async (endpoint, accessToken, options = {}) => {
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
    throw error;
  }

  return data;
};

export const projectService = {
  getProjects: async (accessToken, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/projects${query ? `?${query}` : ""}`;
    return await projectFetch(endpoint, accessToken, { method: "GET" });
  },

  createProject: async (accessToken, projectData) => {
    return await projectFetch("/projects", accessToken, {
      method: "POST",
      body: JSON.stringify(projectData)
    });
  },

  getProjectById: async (accessToken, projectId) => {
    return await projectFetch(`/projects/${projectId}`, accessToken, { method: "GET" });
  },

  updateProject: async (accessToken, projectId, updateData) => {
    return await projectFetch(`/projects/${projectId}`, accessToken, {
      method: "PUT",
      body: JSON.stringify(updateData)
    });
  },

  deleteProject: async (accessToken, projectId) => {
    return await projectFetch(`/projects/${projectId}`, accessToken, { method: "DELETE" });
  }
};

export default projectService;
