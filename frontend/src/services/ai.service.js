const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

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
  // Phase 5 & 2.0 AI Chat Endpoints
  sendChatMessage: async (
    accessToken,
    {
      conversationId,
      message,
      isFreshChat = false,
      responseMode = "detailed",
      language = "auto",
      documentContext = "",
      attachments = []
    }
  ) => {
    return await aiFetch("/ai/chat", accessToken, {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        message,
        isFreshChat,
        responseMode,
        language,
        documentContext,
        attachments
      })
    });
  },

  // Phase 8D Frontend SSE Streaming Integration
  streamChatMessage: async (
    accessToken,
    {
      conversationId,
      message,
      isFreshChat = false,
      responseMode = "detailed",
      language = "auto",
      documentContext = "",
      attachments = []
    },
    onEvent,
    signal
  ) => {
    const url = `${API_BASE_URL}/ai/chat/stream`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        conversationId,
        message,
        isFreshChat,
        responseMode,
        language,
        documentContext,
        attachments
      }),
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

      // Process any trailing lines in buffer after stream completes
      if (buffer.trim()) {
        const remainingLines = buffer.split(/\r?\n/);
        for (const rLine of remainingLines) {
          const trimmed = rLine.trim();
          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }
          if (trimmed.startsWith("data: ")) {
            try {
              const parsedData = JSON.parse(trimmed.slice(6).trim());
              const eventType = currentEvent || "token";
              if (typeof onEvent === "function") {
                onEvent({ type: eventType, data: parsedData });
              }
            } catch {
              // ignore
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

  deleteConversation: async (accessToken, conversationId) => {
    return await aiFetch(`/conversations/${conversationId}`, accessToken, { method: "DELETE" });
  },

  renameConversation: async (accessToken, conversationId, title) => {
    return await aiFetch(`/conversations/${conversationId}`, accessToken, {
      method: "PATCH",
      body: JSON.stringify({ title })
    });
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
  },

  // Multimodal 2.0: Image Generation
  generateImage: async (accessToken, { prompt, conversationId }) => {
    return await aiFetch("/ai/generate-image", accessToken, {
      method: "POST",
      body: JSON.stringify({ prompt, conversationId })
    });
  },

  // Multimodal 2.0: Audio Speech-to-Text Transcription
  transcribeAudio: async (accessToken, { audioBlob, language = "auto" }) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("language", language);

    const url = `${API_BASE_URL}/ai/audio/transcribe`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData,
      credentials: "include"
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to transcribe audio.");
    }
    return data;
  },

  // Multimodal 2.0: Speech Synthesis Metadata
  synthesizeSpeech: async (accessToken, { text, voice, speed }) => {
    return await aiFetch("/ai/audio/synthesize", accessToken, {
      method: "POST",
      body: JSON.stringify({ text, voice, speed })
    });
  },

  // Multimodal 2.0: Document Attachment Upload & Extraction
  uploadDocument: async (accessToken, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE_URL}/ai/documents/upload`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData,
      credentials: "include"
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to upload and parse document.");
    }
    return data;
  },

  // Message Actions: Helpful / Not Useful Feedback
  submitMessageFeedback: async (accessToken, messageId, feedback) => {
    return await aiFetch(`/ai/messages/${messageId}/feedback`, accessToken, {
      method: "PUT",
      body: JSON.stringify({ feedback })
    });
  },

  // Message Actions: Toggle Bookmark / Saved
  toggleSaveMessage: async (accessToken, messageId) => {
    return await aiFetch(`/ai/messages/${messageId}/save`, accessToken, {
      method: "PUT"
    });
  },

  // Educational Tools: Interactive Quiz Generator
  generateQuiz: async (accessToken, { topic, count = 3, difficulty = "Medium" }) => {
    return await aiFetch("/ai/tools/quiz", accessToken, {
      method: "POST",
      body: JSON.stringify({ topic, count, difficulty })
    });
  },

  // Educational Tools: Flashcard Generator
  generateFlashcards: async (accessToken, { topic, count = 5, difficulty = "Medium" }) => {
    return await aiFetch("/ai/tools/flashcards", accessToken, {
      method: "POST",
      body: JSON.stringify({ topic, count, difficulty })
    });
  },

  // Educational Tools: Code Complexity & Review
  reviewCode: async (accessToken, { code, language = "javascript" }) => {
    return await aiFetch("/ai/tools/code-review", accessToken, {
      method: "POST",
      body: JSON.stringify({ code, language })
    });
  }
};

export default aiService;
