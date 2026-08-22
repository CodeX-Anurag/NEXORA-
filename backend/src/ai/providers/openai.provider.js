/**
 * OpenAI Provider Adapter for hosted pre-trained LLMs with streaming support
 */
class OpenAIProviderAdapter {
  constructor(config = {}) {
    this.name = "openai";
    this.apiKey = config.apiKey || process.env.LLM_API_KEY;
    this.model = config.model || process.env.LLM_MODEL || "gpt-4o-mini";
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  async generateResponse({ systemPrompt, messages = [] }) {
    if (!this.apiKey || this.apiKey === "mock-key-for-development") {
      throw new Error("OpenAI API key is missing or not configured.");
    }

    const payloadMessages = [];
    if (systemPrompt) {
      payloadMessages.push({ role: "system", content: systemPrompt });
    }

    for (const msg of messages) {
      payloadMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: payloadMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const safeErrorMsg = data.error?.message || `LLM Provider returned error status ${response.status}`;
      const err = new Error(`AI Provider Error: ${safeErrorMsg}`);
      err.statusCode = 502;
      throw err;
    }

    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    return {
      content,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      },
      provider: "openai",
      model: this.model
    };
  }

  /**
   * OpenAI Streaming Provider implementation emitting normalized { content } chunks
   */
  async generateStream({ systemPrompt, messages = [] }, onChunk, signal) {
    if (!this.apiKey || this.apiKey === "mock-key-for-development") {
      throw new Error("OpenAI API key is missing or not configured.");
    }

    const payloadMessages = [];
    if (systemPrompt) {
      payloadMessages.push({ role: "system", content: systemPrompt });
    }

    for (const msg of messages) {
      payloadMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: payloadMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`AI Provider Stream Error: HTTP ${response.status}`);
      err.statusCode = 502;
      throw err;
    }

    let fullAccumulated = "";

    // Read SSE body stream
    if (response.body && typeof response.body.getReader === "function") {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        if (signal && signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed === "data: [DONE]") {
            break;
          }

          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const token = json.choices?.[0]?.delta?.content || "";
              if (token) {
                fullAccumulated += token;
                if (typeof onChunk === "function") {
                  onChunk({ content: token });
                }
              }
            } catch {
              // ignore partial line parse errors
            }
          }
        }
      }
    }

    return {
      content: fullAccumulated,
      provider: "openai",
      model: this.model
    };
  }
}

module.exports = OpenAIProviderAdapter;
