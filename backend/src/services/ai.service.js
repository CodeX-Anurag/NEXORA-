const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");
const LLMClient = require("../ai/llmClient");
const PromptManager = require("../ai/promptManager");
const ResponseParser = require("../ai/responseParser");
const ContextBuilder = require("../ai/contextBuilder");
const aiUsageService = require("./aiUsage.service");
const aiQualityEvaluator = require("../utils/aiQualityEvaluator");

const MAX_PROMPT_LENGTH = 5000;

/**
 * AI Service: Manages AI chat generation flow with memory & context building
 */
const generateChatResponse = async (userId, { conversationId, messageContent, isFreshChat = false }, llmClientOverride = null) => {
  if (!messageContent || !messageContent.trim()) {
    const err = new Error("Message content is required.");
    err.statusCode = 400;
    throw err;
  }

  if (messageContent.trim().length > MAX_PROMPT_LENGTH) {
    const err = new Error(`Message content exceeds maximum allowed limit of ${MAX_PROMPT_LENGTH} characters.`);
    err.statusCode = 400;
    throw err;
  }

  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      const err = new Error("Conversation not found or access denied.");
      err.statusCode = 404;
      throw err;
    }
  } else {
    const titleSnippet = messageContent.trim().slice(0, 30);
    conversation = await Conversation.create({
      userId,
      title: titleSnippet ? `${titleSnippet}...` : "New AI Coach Session",
      isFreshChat
    });
  }

  // 1. Save user message to database
  const userMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: "user",
    content: messageContent.trim()
  });

  // 2. Load recent messages for conversation
  const previousMessages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 });

  // 3. Build multi-source context (semantic memories, career readiness, study activity)
  const { systemContext, boundedMessages } = await ContextBuilder.buildContext(
    userId,
    messageContent.trim(),
    previousMessages,
    { isFreshChat: conversation.isFreshChat }
  );

  const baseSystemPrompt = PromptManager.getSystemPrompt();
  const combinedSystemPrompt = `${baseSystemPrompt}\n\n${systemContext}`;

  // 4. Call LLM Provider through LLMClient
  const startTime = Date.now();
  const llmClient = llmClientOverride || new LLMClient();
  const rawModelResponse = await llmClient.generateResponse({
    systemPrompt: combinedSystemPrompt,
    messages: boundedMessages
  });
  const latencyMs = Date.now() - startTime;

  // 5. Parse & sanitize model output
  const parsed = ResponseParser.parse(rawModelResponse);
  const qualityEval = aiQualityEvaluator.evaluateTextQuality({ content: parsed.content });

  // Record Telemetry Usage & Quality Signals
  const usageInfo = rawModelResponse?.usage || {};
  aiUsageService.recordUsage({
    userId,
    provider: rawModelResponse?.provider || "mock",
    model: rawModelResponse?.model || "mock-model",
    operation: "chat",
    endpoint: "/api/v1/ai/chat",
    promptTokens: usageInfo.promptTokens || 50,
    completionTokens: usageInfo.completionTokens || 30,
    totalTokens: usageInfo.totalTokens || 80,
    latencyMs,
    qualityScore: qualityEval.qualityScore,
    isValidSchema: qualityEval.isValidSchema,
    schemaCompletenessScore: qualityEval.schemaCompletenessScore,
    fallbackActivated: qualityEval.fallbackActivated,
    qualityIssues: qualityEval.qualityIssues
  });

  // 6. Save assistant message to database
  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: "assistant",
    content: parsed.content
  });

  return {
    conversationId: conversation._id,
    userMessage,
    assistantMessage
  };
};

/**
 * Streaming AI Chat generation flow with SSE token delivery & single message persistence
 */
const generateStreamingChatResponse = async (
  userId,
  { conversationId, messageContent, isFreshChat = false },
  onTokenChunk,
  signal,
  llmClientOverride = null
) => {
  if (!messageContent || !messageContent.trim()) {
    const err = new Error("Message content is required.");
    err.statusCode = 400;
    throw err;
  }

  if (messageContent.trim().length > MAX_PROMPT_LENGTH) {
    const err = new Error(`Message content exceeds maximum allowed limit of ${MAX_PROMPT_LENGTH} characters.`);
    err.statusCode = 400;
    throw err;
  }

  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      const err = new Error("Conversation not found or access denied.");
      err.statusCode = 404;
      throw err;
    }
  } else {
    const titleSnippet = messageContent.trim().slice(0, 30);
    conversation = await Conversation.create({
      userId,
      title: titleSnippet ? `${titleSnippet}...` : "New AI Coach Session",
      isFreshChat
    });
  }

  // 1. Save user message to database
  const userMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: "user",
    content: messageContent.trim()
  });

  // 2. Load recent messages for conversation
  const previousMessages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

  // 3. Build multi-source context with Phase 8B Semantic Memory vector search
  const { systemContext, boundedMessages } = await ContextBuilder.buildContext(
    userId,
    messageContent.trim(),
    previousMessages,
    { isFreshChat: conversation.isFreshChat }
  );

  const baseSystemPrompt = PromptManager.getSystemPrompt();
  const combinedSystemPrompt = `${baseSystemPrompt}\n\n${systemContext}`;

  // 4. Stream tokens via LLMClient and accumulate assistant text server-side
  let accumulatedText = "";
  const startTime = Date.now();
  const llmClient = llmClientOverride || new LLMClient();

  let rawResult;
  let isStreamSuccess = true;
  let streamErrorCat = null;

  try {
    rawResult = await llmClient.generateStream(
      { systemPrompt: combinedSystemPrompt, messages: boundedMessages },
      (chunk) => {
        if (chunk && chunk.content) {
          accumulatedText += chunk.content;
        }
        if (typeof onTokenChunk === "function") {
          onTokenChunk(chunk);
        }
      },
      signal
    );
  } catch (err) {
    isStreamSuccess = false;
    streamErrorCat = signal?.aborted ? "CLIENT_ABORT" : "PROVIDER_ERROR";
    throw err;
  } finally {
    const latencyMs = Date.now() - startTime;
    const usageInfo = rawResult?.usage || {};
    const promptTok = usageInfo.promptTokens || Math.ceil(messageContent.length / 4);
    const compTok = usageInfo.completionTokens || Math.ceil(accumulatedText.length / 4);
    const qualityEval = aiQualityEvaluator.evaluateTextQuality({ content: accumulatedText || rawResult?.content });

    aiUsageService.recordUsage({
      userId,
      provider: rawResult?.provider || "mock",
      model: rawResult?.model || "mock-model",
      operation: "stream",
      endpoint: "/api/v1/ai/chat/stream",
      promptTokens: promptTok,
      completionTokens: compTok,
      totalTokens: promptTok + compTok,
      latencyMs,
      success: isStreamSuccess,
      errorCategory: streamErrorCat,
      qualityScore: isStreamSuccess ? qualityEval.qualityScore : 0,
      isValidSchema: qualityEval.isValidSchema,
      schemaCompletenessScore: qualityEval.schemaCompletenessScore,
      fallbackActivated: !isStreamSuccess,
      qualityIssues: isStreamSuccess ? qualityEval.qualityIssues : ["STREAM_ERROR"]
    });
  }

  // If accumulatedText is empty, fallback to rawResult.content
  const finalContent = accumulatedText || rawResult?.content || "Response generation complete.";
  const parsed = ResponseParser.parse({ content: finalContent });

  // 5. Persist ONE complete assistant Message document after successful generation
  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: "assistant",
    content: parsed.content
  });

  return {
    conversationId: conversation._id,
    userMessage,
    assistantMessage
  };
};

module.exports = {
  generateChatResponse,
  generateStreamingChatResponse
};
