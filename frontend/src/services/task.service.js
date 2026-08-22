const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const taskFetch = async (endpoint, accessToken, options = {}) => {
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

export const taskService = {
  getTasks: async (accessToken, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/tasks${query ? `?${query}` : ""}`;
    return await taskFetch(endpoint, accessToken, { method: "GET" });
  },

  createTask: async (accessToken, taskData) => {
    return await taskFetch("/tasks", accessToken, {
      method: "POST",
      body: JSON.stringify(taskData)
    });
  },

  getTaskById: async (accessToken, taskId) => {
    return await taskFetch(`/tasks/${taskId}`, accessToken, { method: "GET" });
  },

  updateTask: async (accessToken, taskId, updateData) => {
    return await taskFetch(`/tasks/${taskId}`, accessToken, {
      method: "PUT",
      body: JSON.stringify(updateData)
    });
  },

  deleteTask: async (accessToken, taskId) => {
    return await taskFetch(`/tasks/${taskId}`, accessToken, { method: "DELETE" });
  }
};

export default taskService;
