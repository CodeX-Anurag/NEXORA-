const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const aiFetch = async (endpoint, accessToken, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers, credentials: "include" });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `API Error: Status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
};

export const aiService = {
  // Phase 5 AI Chat & Conversation Endpoints
  sendChatMessage: async (accessToken, { conversationId, message }) => {
    return await aiFetch("/ai/chat", accessToken, {
      method: "POST",
      body: JSON.stringify({ conversationId, message })
    });
  },

  // Phase 8D Frontend SSE Streaming Integration
  streamChatMessage: async (accessToken, { conversationId, message, isFreshChat = false }, onEvent, signal) => {
    const url = `${API_BASE_URL}/ai/chat/stream`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ conversationId, message, isFreshChat }),
      credentials: "include",
      signal
    });

    if (!response.ok) {
      let errorMsg = `Streaming HTTP Error ${response.status}`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch {
        // ignore JSON parse error on non-ok response
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      throw err;
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by browser environment.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let currentEvent = null;

    try {
      while (true) {
        if (signal && signal.aborted) {
          try {
            await reader.cancel();
          } catch {
            // ignore cancel errors
          }
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEvent = null;
            continue;
          }

          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6).trim();
            try {
              const parsedData = JSON.parse(dataStr);
              const eventType = currentEvent || "token";
              if (typeof onEvent === "function") {
                onEvent({ type: eventType, data: parsedData });
              }
            } catch {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError" || (signal && signal.aborted)) {
        return;
      }
      throw err;
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // ignore lock release errors
      }
    }
  },

  getConversations: async (accessToken) => {
    return await aiFetch("/conversations", accessToken, { method: "GET" });
  },

  createConversation: async (accessToken, title = "New AI Coach Session", isFreshChat = false) => {
    return await aiFetch("/conversations", accessToken, {
      method: "POST",
      body: JSON.stringify({ title, isFreshChat })
    });
  },

  getMessages: async (accessToken, conversationId) => {
    return await aiFetch(`/conversations/${conversationId}/messages`, accessToken, { method: "GET" });
  },

  // Phase 7 AI Intelligence & Recommendation Endpoints
  analyzeSkillGaps: async (accessToken) => {
    return await aiFetch("/ai/skill-analysis", accessToken, { method: "POST" });
  },

  generateCareerRoadmap: async (accessToken, targetRole) => {
    return await aiFetch("/ai/generate-roadmap", accessToken, {
      method: "POST",
      body: JSON.stringify({ targetRole })
    });
  },

  generateRecommendations: async (accessToken) => {
    return await aiFetch("/ai/recommend", accessToken, { method: "POST" });
  },

  getRecommendations: async (accessToken) => {
    return await aiFetch("/ai/recommendations", accessToken, { method: "GET" });
  },

  submitRecommendationFeedback: async (accessToken, recommendationId, { feedback, status }) => {
    return await aiFetch(`/ai/recommendations/${recommendationId}/feedback`, accessToken, {
      method: "PUT",
      body: JSON.stringify({ feedback, status })
    });
  },

  giveAnotherRecommendation: async (accessToken) => {
    return await aiFetch("/ai/recommendations/give-another", accessToken, { method: "POST" });
  }
};

export default aiService;
