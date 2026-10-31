/**
 * Google Gemini Provider Adapter (REST API — no external SDK required)
 * Supports gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash, etc.
 * Compatible with both generateResponse (non-streaming) and generateStream (SSE streaming).
 */
class GeminiProviderAdapter {
  constructor(config = {}) {
    this.name = "gemini";
    const rawKey = config.apiKey || process.env.LLM_API_KEY || "";
    this.apiKey = rawKey.replace(/^["']|["']$/g, "").trim();

    let model = config.model || process.env.LLM_MODEL || "gemini-flash-lite-latest";
    // Route deprecated or high-demand models to the fast, reliable gemini-flash-lite-latest
    if (
      model === "gemini-1.5-flash" ||
      model === "gemini-1.5-pro" ||
      model === "gemini-2.0-flash" ||
      model === "gemini-2.5-flash" ||
      model === "gemini-flash-latest" ||
      model === "gemini-3.8-flash"
    ) {
      model = "gemini-flash-lite-latest";
    }
    this.model = model;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  }

  /**
   * Safe fetch with timeout to avoid hanging indefinitely on network/DNS issues
   */
  async _fetchWithTimeout(url, options, timeoutMs = 45000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Convert messages array to valid Gemini `contents` format with alternating roles.
   */
  _buildContents(messages = []) {
    const contents = [];

    for (const msg of messages) {
      if (!msg.content || !msg.content.trim()) continue;
      const role = msg.role === "assistant" ? "model" : "user";

      // Gemini requires strictly alternating user/model turns.
      // Merge consecutive turns from the same role.
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${msg.content.trim()}`;
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content.trim() }]
        });
      }
    }

    // Ensure the conversation starts with a user turn
    if (contents.length > 0 && contents[0].role === "model") {
      contents.unshift({
        role: "user",
        parts: [{ text: "Hello" }]
      });
    }

    // Default turn if empty
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello" }]
      });
    }

    return contents;
  }

  /**
   * Non-streaming generation via Gemini generateContent REST endpoint.
   */
  async generateResponse({ systemPrompt, messages = [], temperature = 0.7, maxOutputTokens = 3072, topP = 0.95 }) {
    if (!this.apiKey || this.apiKey.startsWith("mock") || this.apiKey === "your-gemini-api-key-here") {
      throw new Error("Gemini API key is missing or not configured. Set a valid LLM_API_KEY in your .env file.");
    }

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const contents = this._buildContents(messages);

    const reqBody = {
      contents,
      generationConfig: {
        temperature: typeof temperature === "number" ? temperature : 0.7,
        maxOutputTokens: typeof maxOutputTokens === "number" ? maxOutputTokens : 3072,
        topP: typeof topP === "number" ? topP : 0.95
      }
    };

    if (systemPrompt && systemPrompt.trim()) {
      reqBody.system_instruction = {
        parts: [{ text: systemPrompt.trim() }]
      };
    }

    const response = await this._fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const safeErrMsg = data?.error?.message || `Gemini API returned status ${response.status}`;
      const err = new Error(`AI Provider Error (Gemini): ${safeErrMsg}`);
      err.statusCode = 502;
      throw err;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const content = parts.map((p) => p.text || "").join("");
    const usageMeta = data?.usageMetadata || {};

    return {
      content: content || "I'm ready to help you with your studies and career goals. What would you like to work on?",
      usage: {
        promptTokens: usageMeta.promptTokenCount || 0,
        completionTokens: usageMeta.candidatesTokenCount || 0,
        totalTokens: usageMeta.totalTokenCount || 0
      },
      provider: "gemini",
      model: this.model
    };
  }

  /**
   * Streaming generation via Gemini streamGenerateContent REST endpoint (SSE).
   */
  async generateStream({ systemPrompt, messages = [], temperature = 0.7, maxOutputTokens = 3072, topP = 0.95 }, onChunk, signal) {
    if (!this.apiKey || this.apiKey.startsWith("mock") || this.apiKey === "your-gemini-api-key-here") {
      throw new Error("Gemini API key is missing or not configured. Set a valid LLM_API_KEY in your .env file.");
    }

    const url = `${this.baseUrl}/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const contents = this._buildContents(messages);

    const reqBody = {
      contents,
      generationConfig: {
        temperature: typeof temperature === "number" ? temperature : 0.7,
        maxOutputTokens: typeof maxOutputTokens === "number" ? maxOutputTokens : 3072,
        topP: typeof topP === "number" ? topP : 0.95
      }
    };

    if (systemPrompt && systemPrompt.trim()) {
      reqBody.system_instruction = {
        parts: [{ text: systemPrompt.trim() }]
      };
    }

    const response = await this._fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
        signal
      },
      45000
    );

    if (!response.ok) {
      let errMsg = `Gemini Stream Error: HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errMsg = errData?.error?.message || errMsg;
      } catch {
        // ignore
      }
      const err = new Error(errMsg);
      err.statusCode = 502;
      throw err;
    }

    let fullAccumulated = "";

    if (response.body && typeof response.body.getReader === "function") {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        if (signal && signal.aborted) {
          try {
            await reader.cancel();
          } catch {
            // ignore
          }
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
          if (trimmed === "data: [DONE]") break;

          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const parts = json?.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                const token = part.text || "";
                if (token) {
                  fullAccumulated += token;
                  if (typeof onChunk === "function") {
                    onChunk({ content: token });
                  }
                }
              }
            } catch {
              // ignore partial JSON parse errors mid-stream
            }
          }
        }
      }
    }

    if (!fullAccumulated) {
      fullAccumulated = "I'm your NEXORA AI Coach. How can I help you with your studies or career prep today?";
      if (typeof onChunk === "function") {
        onChunk({ content: fullAccumulated });
      }
    }

    return {
      content: fullAccumulated,
      provider: "gemini",
      model: this.model
    };
  }
}

module.exports = GeminiProviderAdapter;
