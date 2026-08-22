const Memory = require("../models/Memory.model");
const User = require("../models/User.model");
const EmbeddingClient = require("../ai/embeddingClient");

/**
 * Create a new user memory with privacy-governed embedding generation
 */
const createMemory = async (userId, { memory, type, importance, source }, embeddingClientOverride = null) => {
  if (!memory || !memory.trim()) {
    const err = new Error("Memory content is required.");
    err.statusCode = 400;
    throw err;
  }

  const cleanText = memory.trim();

  // Check user privacy settings before embedding generation
  const user = await User.findById(userId);
  const aiMemoryEnabled = user?.preferences?.aiMemoryEnabled !== false;

  let embeddingVector;
  if (aiMemoryEnabled) {
    const client = embeddingClientOverride || new EmbeddingClient();
    embeddingVector = await client.generateEmbedding(cleanText);
  }

  const newMemory = await Memory.create({
    userId,
    memory: cleanText,
    type: type || "long_term",
    importance: importance || 3,
    source: source || "user_explicit",
    embedding: embeddingVector
  });

  return newMemory;
};

/**
 * Get memories for authenticated user with optional type filtering
 */
const getMemories = async (userId, query = {}) => {
  const filter = { userId };
  if (query.type) {
    filter.type = query.type;
  }

  return await Memory.find(filter).sort({ importance: -1, createdAt: -1 });
};

/**
 * Update memory by ID and regenerate vector embedding if text changes
 */
const updateMemory = async (userId, memoryId, updateData, embeddingClientOverride = null) => {
  const allowedUpdates = ["memory", "type", "importance"];
  const updates = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  }

  // If memory text changes, regenerate embedding before saving
  if (updates.memory && updates.memory.trim()) {
    const user = await User.findById(userId);
    const aiMemoryEnabled = user?.preferences?.aiMemoryEnabled !== false;

    if (aiMemoryEnabled) {
      const client = embeddingClientOverride || new EmbeddingClient();
      updates.embedding = await client.generateEmbedding(updates.memory.trim());
    }
  }

  const memory = await Memory.findOneAndUpdate(
    { _id: memoryId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!memory) {
    const err = new Error("Memory item not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  return memory;
};

/**
 * Delete a single memory by ID
 */
const deleteMemory = async (userId, memoryId) => {
  const memory = await Memory.findOneAndDelete({ _id: memoryId, userId });
  if (!memory) {
    const err = new Error("Memory item not found or access denied.");
    err.statusCode = 404;
    throw err;
  }
  return { success: true, message: "Memory item deleted successfully." };
};

/**
 * Delete all memories for authenticated user
 */
const deleteAllMemories = async (userId) => {
  const result = await Memory.deleteMany({ userId });
  return {
    success: true,
    message: `All memories deleted successfully (${result.deletedCount} items removed).`
  };
};

module.exports = {
  createMemory,
  getMemories,
  updateMemory,
  deleteMemory,
  deleteAllMemories
};
