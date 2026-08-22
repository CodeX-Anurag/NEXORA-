const MockEmbeddingProvider = require("./providers/mockEmbedding.provider");
const OpenAIEmbeddingProvider = require("./providers/openaiEmbedding.provider");
const { EMBEDDING_PROVIDER, EMBEDDING_DIMENSION } = require("../config/env");

/**
 * Provider-Agnostic Embedding Client Factory
 * Centralized interface for generating text embeddings matching configured dimension
 */
class EmbeddingClient {
  constructor(overrideProvider = null, overrideDimension = null) {
    const providerName = (overrideProvider || EMBEDDING_PROVIDER || "mock").toLowerCase();
    this.dimension = overrideDimension || EMBEDDING_DIMENSION || 1536;

    if (providerName === "openai") {
      this.adapter = new OpenAIEmbeddingProvider({ dimension: this.dimension });
    } else {
      this.adapter = new MockEmbeddingProvider({ dimension: this.dimension });
    }
  }

  /**
   * Generates text embedding and validates returned vector dimension
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new Error("Text content is required for embedding generation.");
    }

    const vector = await this.adapter.generateEmbedding(text.trim());

    if (!Array.isArray(vector)) {
      throw new Error("Embedding provider failed to return a valid vector array.");
    }

    if (vector.length !== this.dimension) {
      throw new Error(
        `Invalid vector dimension: expected ${this.dimension}, received ${vector.length}`
      );
    }

    return vector;
  }
}

module.exports = EmbeddingClient;
