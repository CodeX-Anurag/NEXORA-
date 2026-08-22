const MockProviderAdapter = require("./providers/mock.provider");
const OpenAIProviderAdapter = require("./providers/openai.provider");
const { LLM_PROVIDER, LLM_API_KEY, LLM_MODEL } = require("../config/env");

/**
 * Unified LLM Client Factory supporting provider portability & streaming
 */
class LLMClient {
  constructor(overrideProvider = null) {
    const providerName = (overrideProvider || LLM_PROVIDER || "mock").toLowerCase();

    if (providerName === "openai") {
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
    return await this.adapter.generateResponse(params);
  }

  async generateStream(params, onChunk, signal) {
    if (typeof this.adapter.generateStream === "function") {
      return await this.adapter.generateStream(params, onChunk, signal);
    }
    // Fallback if provider adapter doesn't implement generateStream
    const res = await this.generateResponse(params);
    if (typeof onChunk === "function") {
      onChunk({ content: res.content });
    }
    return res;
  }
}

module.exports = LLMClient;
