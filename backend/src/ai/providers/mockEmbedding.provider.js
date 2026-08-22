const { EMBEDDING_DIMENSION } = require("../../config/env");

/**
 * Deterministic Mock Embedding Provider
 * Returns a 1536-dimensional (or configured EMBEDDING_DIMENSION) float array
 */
class MockEmbeddingProvider {
  constructor(options = {}) {
    this.dimension = options.dimension || EMBEDDING_DIMENSION || 1536;
  }

  /**
   * Deterministic seed generator based on input string
   */
  _hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  /**
   * Generates a deterministic normalized float vector array
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text input for embedding generation.");
    }

    const seed = this._hashString(text.trim());
    const vector = new Array(this.dimension);

    for (let i = 0; i < this.dimension; i++) {
      // Generate pseudo-random float between -1.0 and 1.0 based on seed + index
      const val = Math.sin(seed * (i + 1)) * 10000;
      vector[i] = parseFloat((val - Math.floor(val) - 0.5).toFixed(6));
    }

    return vector;
  }
}

module.exports = MockEmbeddingProvider;
