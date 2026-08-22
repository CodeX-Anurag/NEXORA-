const mongoose = require("mongoose");
const Memory = require("../models/Memory.model");
const EmbeddingClient = require("./embeddingClient");
const { cosineSimilarity } = require("../utils/vectorMath");

/**
 * Memory Retriever: Semantic Vector Search & Privacy-Governed Retrieval Engine
 */
class MemoryRetriever {
  /**
   * Retrieve relevant memories using MongoDB Atlas $vectorSearch with controlled fallback
   */
  static async retrieveRelevantMemories(userId, promptText = "", memorySettings = {}, embeddingClientOverride = null) {
    // 1. Explicit Privacy Check: aiMemoryEnabled = false turns off all memory retrieval
    if (memorySettings.aiMemoryEnabled === false) {
      return [];
    }

    if (!promptText || !promptText.trim()) {
      return [];
    }

    // 2. Generate Query Vector Embedding
    let queryVector = null;
    try {
      const embeddingClient = embeddingClientOverride || new EmbeddingClient();
      queryVector = await embeddingClient.generateEmbedding(promptText.trim());
    } catch {
      // If embedding generation fails, fall back to keyword search
    }

    // 3. Prepare Filters for userId and Privacy bounds
    const userObjectId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
    const filterConditions = {
      userId: { $eq: userObjectId }
    };

    if (memorySettings.preferenceMemoryEnabled === false) {
      filterConditions.type = { $ne: "preference" };
    }

    // 4. Primary Production Engine: MongoDB Atlas $vectorSearch Pipeline
    if (queryVector) {
      try {
        const pipeline = [
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 50,
              limit: 5,
              filter: filterConditions
            }
          },
          {
            $project: {
              memory: 1,
              importance: 1,
              type: 1,
              score: { $meta: "vectorSearchScore" }
            }
          }
        ];

        const vectorResults = await Memory.aggregate(pipeline);
        if (vectorResults && vectorResults.length > 0) {
          return vectorResults.map((r) => r.memory);
        }
      } catch {
        // Fall back to in-memory cosine similarity / keyword search if Atlas vector index is not available
      }
    }

    // 5. Fallback Engine for Local Dev / Non-Indexed MongoDB / Tests
    const baseQuery = { userId };
    if (memorySettings.preferenceMemoryEnabled === false) {
      baseQuery.type = { $ne: "preference" };
    }

    const memories = await Memory.find(baseQuery).sort({ importance: -1, createdAt: -1 });
    if (memories.length === 0) return [];

    const promptLower = promptText.toLowerCase();
    const words = promptLower.split(/\s+/).filter((w) => w.length > 3);

    const scoredMemories = memories.map((mem) => {
      let score = mem.importance || 1;

      // Use cosine similarity if embedding is stored on document and query vector exists
      if (queryVector && Array.isArray(mem.embedding) && mem.embedding.length === queryVector.length) {
        const cosSim = cosineSimilarity(queryVector, mem.embedding);
        score += cosSim * 10;
      } else {
        // Keyword fallback
        const memText = mem.memory.toLowerCase();
        for (const word of words) {
          if (memText.includes(word)) {
            score += 3;
          }
        }
      }

      return { mem, score };
    });

    scoredMemories.sort((a, b) => b.score - a.score);
    return scoredMemories.slice(0, 5).map((item) => item.mem.memory);
  }
}

module.exports = MemoryRetriever;
