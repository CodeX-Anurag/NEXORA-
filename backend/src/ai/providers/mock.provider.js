/**
 * Mock Provider Adapter for testing & zero-cost development with streaming support
 */
class MockProviderAdapter {
  constructor(config = {}) {
    this.name = "mock";
    this.model = config.model || "mock-model";
  }

  async generateResponse({ systemPrompt: _systemPrompt, messages = [] }) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    
    let reply = `Hello! I am your NEXORA AI Coach. I received your prompt: "${lastUserMsg}". How can I help you break down your study schedule or career goals today?`;

    if (lastUserMsg.toLowerCase().includes("react") || lastUserMsg.toLowerCase().includes("javascript")) {
      reply = `Great topic! Working with ${lastUserMsg.includes("React") ? "React" : "JavaScript"} requires building solid foundational projects and tracking your practice hours in NEXORA.`;
    } else if (lastUserMsg.toLowerCase().includes("task") || lastUserMsg.toLowerCase().includes("study")) {
      reply = "Staying consistent with your daily tasks and study sessions is the single best predictor of student success. Keep up the great work!";
    }

    return {
      content: reply,
      usage: {
        promptTokens: 50,
        completionTokens: 30,
        totalTokens: 80
      },
      provider: "mock",
      model: this.model
    };
  }

  /**
   * Progressive token stream simulation
   */
  async generateStream(params, onChunk, signal) {
    const res = await this.generateResponse(params);
    const text = res.content;
    const words = text.split(" ");

    for (let i = 0; i < words.length; i++) {
      if (signal && signal.aborted) {
        break;
      }

      const chunkText = (i === words.length - 1) ? words[i] : words[i] + " ";
      if (typeof onChunk === "function") {
        onChunk({ content: chunkText });
      }

      // Small async delay between simulated token chunks
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    return res;
  }
}

module.exports = MockProviderAdapter;
