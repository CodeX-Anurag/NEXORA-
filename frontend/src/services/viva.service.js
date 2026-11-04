const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

const vivaFetch = async (endpoint, accessToken, options = {}) => {
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
    error.data = data;
    throw error;
  }

  return data;
};

export const vivaService = {
  // Start session (supports both startVivaSession and startSession)
  startVivaSession: async (accessToken, payload) => {
    const data = await vivaFetch("/viva/start", accessToken, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const activeRound = data.activeRound || (data.session?.rounds ? data.session.rounds[0] : null);
    return {
      ...data,
      activeRound
    };
  },

  startSession: async (accessToken, payload) => {
    return await vivaService.startVivaSession(accessToken, payload);
  },

  // Submit answer (supports both submitVivaAnswer and submitAnswer)
  submitVivaAnswer: async (accessToken, sessionId, payload) => {
    const answerText = typeof payload === "string" ? payload : (payload?.studentAnswer || payload?.answer || "");
    const data = await vivaFetch(`/viva/${sessionId}/submit`, accessToken, {
      method: "POST",
      body: JSON.stringify({ answer: answerText, studentAnswer: answerText, roundNumber: payload?.roundNumber })
    });
    const isFinished = Boolean(data.isFinished || data.isCompleted || data.session?.status === "completed");
    const nextRound = data.nextRound || (data.session?.rounds ? data.session.rounds[data.session.currentRound - 1] : null);
    return {
      ...data,
      isFinished,
      isCompleted: isFinished,
      nextRound
    };
  },

  submitAnswer: async (accessToken, sessionId, answerOrPayload) => {
    return await vivaService.submitVivaAnswer(accessToken, sessionId, answerOrPayload);
  },

  // Get history (supports both getVivaHistory and getHistory)
  getVivaHistory: async (accessToken) => {
    const data = await vivaFetch("/viva/history", accessToken, {
      method: "GET"
    });
    const sessions = data.sessions || data.history || [];
    return {
      ...data,
      sessions,
      history: sessions
    };
  },

  getHistory: async (accessToken) => {
    return await vivaService.getVivaHistory(accessToken);
  },

  // Get session by ID (supports getVivaSessionById and getSessionById)
  getVivaSessionById: async (accessToken, sessionId) => {
    return await vivaFetch(`/viva/${sessionId}`, accessToken, {
      method: "GET"
    });
  },

  getSessionById: async (accessToken, sessionId) => {
    return await vivaService.getVivaSessionById(accessToken, sessionId);
  },

  // Convert recommendations to tasks (supports createTasksFromViva and convertRecommendationsToTasks)
  createTasksFromViva: async (accessToken, sessionId) => {
    const data = await vivaFetch(`/viva/${sessionId}/create-tasks`, accessToken, {
      method: "POST"
    });
    const tasksCount = data.tasksCreatedCount ?? (Array.isArray(data.tasks) ? data.tasks.length : (data.count ?? 0));
    return {
      ...data,
      tasksCreatedCount: tasksCount
    };
  },

  convertRecommendationsToTasks: async (accessToken, sessionId) => {
    return await vivaService.createTasksFromViva(accessToken, sessionId);
  }
};

export default vivaService;
