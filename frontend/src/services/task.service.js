import apiClient from "./api";

export const taskService = {
  getTasks: async (accessToken, params = {}) => {
    if (!accessToken) throw new Error("Authentication token required.");
    const query = new URLSearchParams(params).toString();
    return await apiClient(`/tasks${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  createTask: async (accessToken, taskData) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(taskData)
    });
  },

  getTaskById: async (accessToken, taskId) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  updateTask: async (accessToken, taskId, updateData) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(updateData)
    });
  },

  deleteTask: async (accessToken, taskId) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  getTaskAnalytics: async (accessToken) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient("/tasks/analytics", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  addSubtask: async (accessToken, taskId, title) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ title })
    });
  },

  toggleSubtask: async (accessToken, taskId, subtaskId, completed) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ completed })
    });
  },

  deleteSubtask: async (accessToken, taskId, subtaskId) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  recordFocusSession: async (accessToken, taskId, payload) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}/focus-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload)
    });
  },

  toggleMyDay: async (accessToken, taskId, isMyDay) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}/my-day`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(typeof isMyDay === "boolean" ? { isMyDay } : {})
    });
  },

  aiBreakdown: async (accessToken, payload) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient("/tasks/ai/breakdown", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload)
    });
  },

  aiDailyPlan: async (accessToken, payload = {}) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient("/tasks/ai/daily-plan", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload)
    });
  },

  aiRiskDetection: async (accessToken) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient("/tasks/ai/risk-detection", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  aiSmartReschedule: async (accessToken, taskId) => {
    if (!accessToken) throw new Error("Authentication token required.");
    return await apiClient(`/tasks/${taskId}/ai/smart-reschedule`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }
};

export default taskService;
