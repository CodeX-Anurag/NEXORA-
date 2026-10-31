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
    const lower = lastUserMsg.toLowerCase().trim();

    let reply = "";

    if (lower.includes("sql")) {
      reply = [
        "**SQL (Structured Query Language)** is the standard language for communicating with relational databases.",
        "",
        "Here is what it does in 3 simple points:",
        "• **Store Data:** Insert and organize records in structured tables.",
        "• **Query Data:** Retrieve specific information with `SELECT ... WHERE`.",
        "• **Modify Data:** Update or delete records safely with constraints.",
        "",
        "Which database are you working with right now (e.g., PostgreSQL, MySQL, SQLite)?"
      ].join("\n");
    } else if (lower.includes("react")) {
      reply = [
        "**React** is a popular JavaScript library for building fast, component-based user interfaces.",
        "",
        "Key concepts to master step-by-step:",
        "1. **JSX & Components:** Building reusable modular UI blocks.",
        "2. **State & Props (`useState`):** Managing interactive data flow.",
        "3. **Effects (`useEffect`):** Handling API calls and side-effects.",
        "",
        "Are you working on functional components, or would you like to build a quick example together?"
      ].join("\n");
    } else if (lower.includes("doubt") || lower === "hi" || lower === "hello") {
      reply = [
        "Hello! I am your **NEXORA AI Coach**.",
        "",
        "I can help you with:",
        "• Clarifying technical doubts (JavaScript, Python, SQL, Web Dev)",
        "• Breaking down complex study topics into daily tasks",
        "• Setting up career roadmaps and preparing for tech interviews",
        "",
        "What specific topic or doubt would you like to explore today?"
      ].join("\n");
    } else {
      reply = [
        `I understand you're asking about **"${lastUserMsg}"**.`,
        "",
        "Here is how we can tackle this step-by-step:",
        "• Understand the core concept and its practical use cases.",
        "• Practice with a short, hands-on example.",
        "• Log your study time in your NEXORA tracker to build momentum.",
        "",
        "What is the first sub-topic you would like us to dive into?"
      ].join("\n");
    }

    return {
      content: reply,
      usage: {
        promptTokens: 50,
        completionTokens: 60,
        totalTokens: 110
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
