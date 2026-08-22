import api from "./api";

/**
 * Memory Service: Handles HTTP requests for Phase 6 Memory System
 */
export const memoryService = {
  /**
   * Get user memories with optional type filter
   */
  getMemories: async (type = "") => {
    const params = type ? { type } : {};
    const response = await api.get("/memories", { params });
    return response.data;
  },

  /**
   * Create a new memory item
   */
  createMemory: async (memoryData) => {
    const response = await api.post("/memories", memoryData);
    return response.data;
  },

  /**
   * Update memory item by ID
   */
  updateMemory: async (id, updateData) => {
    const response = await api.put(`/memories/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete single memory item by ID
   */
  deleteMemory: async (id) => {
    const response = await api.delete(`/memories/${id}`);
    return response.data;
  },

  /**
   * Delete all memories for authenticated user
   */
  deleteAllMemories: async () => {
    const response = await api.delete("/memories");
    return response.data;
  }
};

export default memoryService;
