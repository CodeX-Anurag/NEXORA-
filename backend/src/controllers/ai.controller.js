const aiService = require("../services/ai.service");
const aiIntelligenceService = require("../services/aiIntelligence.service");

const chat = async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;
    const result = await aiService.generateChatResponse(req.userId, {
      conversationId,
      messageContent: message
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SSE Backend Streaming Endpoint: POST /api/v1/ai/chat/stream
 */
const chatStream = async (req, res, next) => {
  const { conversationId, message, isFreshChat } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message content is required for streaming."
    });
  }

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const writeSSE = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const abortController = new AbortController();
  let isStreamCompleted = false;

  // Handle Client Disconnect Guard
  req.on("close", () => {
    if (!isStreamCompleted) {
      abortController.abort();
    }
  });

  try {
    let startEmitted = false;

    const result = await aiService.generateStreamingChatResponse(
      req.userId,
      { conversationId, messageContent: message, isFreshChat },
      (chunk) => {
        if (!startEmitted) {
          // Send initial start event once user message is created/validated
          startEmitted = true;
          writeSSE("start", {
            conversationId: result?.conversationId || conversationId || "new",
            userMessageId: result?.userMessage?._id || null
          });
        }

        if (chunk && chunk.content) {
          writeSSE("token", { content: chunk.content });
        }
      },
      abortController.signal
    );

    // If start was not emitted yet, emit start event now
    if (!startEmitted) {
      writeSSE("start", {
        conversationId: result.conversationId,
        userMessageId: result.userMessage._id
      });
    }

    // Stream finished successfully
    isStreamCompleted = true;

    // Send complete event with IDs (no full content duplication)
    writeSSE("complete", {
      conversationId: result.conversationId,
      userMessageId: result.userMessage._id,
      assistantMessageId: result.assistantMessage._id
    });

    return res.end();
  } catch (error) {
    if (!isStreamCompleted) {
      writeSSE("error", {
        code: "AI_STREAM_ERROR",
        message: error.message || "Unable to complete AI streaming response."
      });
    }
    return res.end();
  }
};

const analyzeSkillGaps = async (req, res, next) => {
  try {
    const result = await aiIntelligenceService.analyzeSkillGaps(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const generateRoadmap = async (req, res, next) => {
  try {
    const { targetRole } = req.body || {};
    const result = await aiIntelligenceService.generateCareerRoadmap(req.userId, targetRole);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const generateRecommendations = async (req, res, next) => {
  try {
    const recommendation = await aiIntelligenceService.generateRecommendations(req.userId);
    return res.status(201).json({
      success: true,
      recommendation
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await aiIntelligenceService.getRecommendations(req.userId);
    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    next(error);
  }
};

const handleFeedback = async (req, res, next) => {
  try {
    const { feedback, status } = req.body || {};
    const recommendation = await aiIntelligenceService.submitFeedback(req.userId, req.params.id, {
      feedback,
      status
    });
    return res.status(200).json({
      success: true,
      message: "Recommendation feedback recorded successfully.",
      recommendation
    });
  } catch (error) {
    next(error);
  }
};

const giveAnother = async (req, res, next) => {
  try {
    const recommendation = await aiIntelligenceService.giveAnotherRecommendation(req.userId);
    return res.status(201).json({
      success: true,
      message: "Generated distinct new recommendation.",
      recommendation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
  chatStream,
  analyzeSkillGaps,
  generateRoadmap,
  generateRecommendations,
  getRecommendations,
  handleFeedback,
  giveAnother
};
