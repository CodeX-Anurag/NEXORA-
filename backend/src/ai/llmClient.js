const MockProviderAdapter = require("./providers/mock.provider");
const OpenAIProviderAdapter = require("./providers/openai.provider");
const GeminiProviderAdapter = require("./providers/gemini.provider");
const { LLM_PROVIDER, LLM_API_KEY, LLM_MODEL } = require("../config/env");

/**
 * Unified LLM Client Factory supporting provider portability & streaming
 * Supported providers: "gemini" | "openai" | "mock"
 */
class LLMClient {
  constructor(overrideProvider = null) {
    const providerName = (overrideProvider || LLM_PROVIDER || "mock").toLowerCase();

    if (providerName === "gemini") {
      this.adapter = new GeminiProviderAdapter({
        apiKey: LLM_API_KEY,
        model: LLM_MODEL
      });
    } else if (providerName === "openai") {
      this.adapter = new OpenAIProviderAdapter({
        apiKey: LLM_API_KEY,
        model: LLM_MODEL
      });
    } else {
      this.adapter = new MockProviderAdapter({
        model: LLM_MODEL
      });
    }
  }

  async generateResponse(params) {
    try {
      return await this.adapter.generateResponse(params);
    } catch (err) {
      if (process.env.NODE_ENV !== "production" && this.adapter.name !== "mock") {
        console.warn(`[LLMClient Fallback] ${this.adapter.name} failed: ${err.message}. Using MockProvider.`);
        const fallback = new MockProviderAdapter({ model: "mock-model" });
        return await fallback.generateResponse(params);
      }
      throw err;
    }
  }

  async generateStream(params, onChunk, signal) {
    try {
      if (typeof this.adapter.generateStream === "function") {
        return await this.adapter.generateStream(params, onChunk, signal);
      }
      // Fallback if provider adapter doesn't implement generateStream
      const res = await this.generateResponse(params);
      if (typeof onChunk === "function") {
        onChunk({ content: res.content });
      }
      return res;
    } catch (err) {
      if (process.env.NODE_ENV !== "production" && this.adapter.name !== "mock") {
        console.warn(`[LLMClient Fallback] ${this.adapter.name} stream failed: ${err.message}. Using MockProvider.`);
        const fallback = new MockProviderAdapter({ model: "mock-model" });
        return await fallback.generateStream(params, onChunk, signal);
      }
      throw err;
    }
  }
}

module.exports = LLMClient;
