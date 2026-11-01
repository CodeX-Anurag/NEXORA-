import apiClient from "./api";

/**
 * Memory Service: Handles HTTP requests for Phase 6 Memory System
 */
export const memoryService = {
  /**
   * Get user memories with optional type filter
   */
  getMemories: async (tokenOrType = "", optionalType = "") => {
    let token = "";
    let type = "";

    if (optionalType || (tokenOrType && tokenOrType.length > 25)) {
      token = tokenOrType;
      type = optionalType;
    } else {
      type = tokenOrType;
    }

    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    return await apiClient(`/memories${query}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },

  /**
   * Create a new memory item
   */
  createMemory: async (tokenOrData, optionalData = null) => {
    const token = optionalData ? tokenOrData : "";
    const data = optionalData || tokenOrData;

    return await apiClient("/memories", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data)
    });
  },

  /**
   * Update memory item by ID
   */
  updateMemory: async (tokenOrId, idOrUpdateData, optionalUpdateData = null) => {
    let token = "";
    let id = "";
    let updateData = {};

    if (optionalUpdateData) {
      token = tokenOrId;
      id = idOrUpdateData;
      updateData = optionalUpdateData;
    } else {
      id = tokenOrId;
      updateData = idOrUpdateData;
    }

    return await apiClient(`/memories/${id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(updateData)
    });
  },

  /**
   * Delete single memory item by ID
   */
  deleteMemory: async (tokenOrId, optionalId = null) => {
    const token = optionalId ? tokenOrId : "";
    const id = optionalId || tokenOrId;

    return await apiClient(`/memories/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },

  /**
   * Delete all memories for authenticated user
   */
  deleteAllMemories: async (token = "") => {
    return await apiClient("/memories", {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
};

export default memoryService;
