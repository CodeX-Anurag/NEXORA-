const { EMBEDDING_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIMENSION } = require("../../config/env");

/**
 * OpenAI Hosted Embedding Provider Adapter
 * Interfaces with text-embedding-3-small API returning 1536-dimensional vector array
 */
class OpenAIEmbeddingProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || EMBEDDING_API_KEY;
    this.model = options.model || EMBEDDING_MODEL || "text-embedding-3-small";
    this.dimension = options.dimension || EMBEDDING_DIMENSION || 1536;
  }

  async generateEmbedding(text) {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text input for embedding generation.");
    }

    if (!this.apiKey || this.apiKey === "mock-key") {
      throw new Error("OpenAI API key missing or invalid for embedding provider.");
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: text.trim(),
        model: this.model
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`OpenAI Embedding API error: ${data.error?.message || response.statusText}`);
    }

    const vector = data.data?.[0]?.embedding;
    if (!Array.isArray(vector)) {
      throw new Error("OpenAI Embedding API returned invalid response format.");
    }

    if (vector.length !== this.dimension) {
      throw new Error(`Embedding dimension mismatch: expected ${this.dimension}, received ${vector.length}`);
    }

    return vector;
  }
}

module.exports = OpenAIEmbeddingProvider;
