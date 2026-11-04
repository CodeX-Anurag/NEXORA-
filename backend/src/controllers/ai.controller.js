const crypto = require("crypto");
const aiService = require("../services/ai.service");
const aiIntelligenceService = require("../services/aiIntelligence.service");
const ImageGenerationProvider = require("../ai/providers/image.provider");
const AudioProvider = require("../ai/providers/audio.provider");
const DocumentContextService = require("../services/documentContext.service");
const Message = require("../models/Message.model");
const Conversation = require("../models/Conversation.model");

const imageProvider = new ImageGenerationProvider();
const audioProvider = new AudioProvider();

const chat = async (req, res, next) => {
  try {
    const {
      conversationId,
      message,
      isFreshChat,
      responseMode,
      language,
      documentContext,
      attachments
    } = req.body;
    const result = await aiService.generateChatResponse(req.userId, {
      conversationId,
      messageContent: message,
      isFreshChat,
      responseMode,
      language,
      documentContext,
      attachments
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
const chatStream = async (req, res, _next) => {
  const {
    conversationId,
    message,
    isFreshChat,
    responseMode,
    language,
    documentContext,
    attachments
  } = req.body || {};

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

    const emitStart = (info = {}) => {
      if (!startEmitted) {
        startEmitted = true;
        writeSSE("start", {
          conversationId: info.conversationId || conversationId || "new",
          userMessageId: info.userMessageId || info.userMessage?._id || null
        });
      }
    };

    const result = await aiService.generateStreamingChatResponse(
      req.userId,
      {
        conversationId,
        messageContent: message,
        isFreshChat,
        responseMode,
        language,
        documentContext,
        attachments,
        onStart: (info) => emitStart(info)
      },
      (chunk) => {
        emitStart();

        if (chunk && chunk.content) {
          writeSSE("token", { token: chunk.content, content: chunk.content });
        }
      },
      abortController.signal
    );

    // If start was not emitted yet, emit start event now
    emitStart({
      conversationId: result.conversationId,
      userMessageId: result.userMessage?._id
    });

    // Stream finished successfully
    isStreamCompleted = true;

    // Send complete and done events with full metadata
    writeSSE("complete", {
      conversationId: result.conversationId,
      userMessageId: result.userMessage._id,
      assistantMessageId: result.assistantMessage._id,
      content: result.assistantMessage.content,
      metadata: result.assistantMessage.metadata
    });
    writeSSE("done", {
      conversationId: result.conversationId,
      userMessageId: result.userMessage._id,
      messageId: result.assistantMessage._id,
      completeContent: result.assistantMessage.content,
      metadata: result.assistantMessage.metadata
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

/**
 * Image Generation Endpoint: POST /api/v1/ai/generate-image
 */
const generateImage = async (req, res, next) => {
  try {
    const { prompt, conversationId } = req.body || {};
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: "Prompt is required for image generation." });
    }

    const image = await imageProvider.generateImage({
      prompt: prompt.trim(),
      userId: req.userId
    });

    let targetConv = null;
    if (conversationId) {
      targetConv = await Conversation.findOne({ _id: conversationId, userId: req.userId });
    }
    if (!targetConv) {
      targetConv = await Conversation.create({
        userId: req.userId,
        title: `Visual: ${prompt.trim().slice(0, 26)}`
      });
    }

    const userMessage = await Message.create({
      conversationId: targetConv._id,
      userId: req.userId,
      role: "user",
      content: `Generate visual diagram: "${prompt.trim()}"`
    });

    const assistantMessage = await Message.create({
      conversationId: targetConv._id,
      userId: req.userId,
      role: "assistant",
      content: `Here is the technical visual explanation for **"${prompt.trim()}"**:`,
      metadata: {
        imagePrompt: prompt.trim(),
        imageUrl: image.url,
        toolType: "image_generation"
      }
    });

    return res.status(200).json({
      success: true,
      image,
      conversationId: targetConv._id,
      userMessage,
      assistantMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Audio Transcription Endpoint: POST /api/v1/ai/audio/transcribe
 */
const transcribeAudio = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: "Audio file is required for transcription." });
    }

    const result = await audioProvider.transcribeAudio({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype || "audio/webm",
      language: req.body?.language || "auto"
    });

    return res.status(200).json({
      success: true,
      text: result.text,
      source: result.source
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Speech Synthesis Endpoint: POST /api/v1/ai/audio/synthesize
 */
const synthesizeSpeech = async (req, res, next) => {
  try {
    const { text, voice, speed } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Text is required for speech synthesis." });
    }

    const result = await audioProvider.synthesizeSpeech({
      text: text.trim(),
      voice,
      speed: Number(speed) || 1.0
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Document Upload Endpoint: POST /api/v1/ai/documents/upload
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: "File is required." });
    }

    const extracted = await DocumentContextService.extractText({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    });

    return res.status(200).json({
      success: true,
      document: {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        textLength: extracted.textLength,
        extractedContent: extracted.extractedContent
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Message Feedback Endpoint: PUT /api/v1/ai/messages/:id/feedback
 */
const submitMessageFeedback = async (req, res, next) => {
  try {
    const { feedback } = req.body || {};
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { feedback },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

/**
 * Save / Bookmark Message: PUT /api/v1/ai/messages/:id/save
 */
const toggleSaveMessage = async (req, res, next) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, userId: req.userId });
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    message.saved = !message.saved;
    await message.save();

    return res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const extractJsonBlock = (text, fenceType = "json") => {
  if (!text) return null;
  const regex = new RegExp("```(?:" + fenceType + "|json)?\\s*([\\s\\S]*?)```", "i");
  const match = text.match(regex);
  const jsonStr = match ? match[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(jsonStr.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

/**
 * Interactive Quiz Tool Generator: POST /api/v1/ai/tools/quiz
 */
const generateQuiz = async (req, res, next) => {
  try {
    const { topic = "Binary Search Trees", count = 3, difficulty = "Medium" } = req.body || {};

    const prompt = `Create an interactive ${count}-question multiple choice quiz on "${topic}".
Difficulty: ${difficulty}.
Return ONLY valid JSON wrapped in a \`\`\`quiz block with this exact format:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}`;

    let quizData = null;
    let chatResult = null;

    try {
      chatResult = await aiService.generateChatResponse(req.userId, {
        messageContent: prompt,
        responseMode: "exam_prep"
      });
      quizData = extractJsonBlock(chatResult.assistantMessage?.content, "quiz");
    } catch (err) {
      console.warn("[QuizGenerator] AI call warning:", err.message);
    }

    if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      // High-yield topic fallback
      quizData = {
        topic,
        difficulty,
        questions: [
          {
            question: `What is the primary architectural invariant of a Binary Search Tree (BST)?`,
            options: [
              "Left subtree keys < Node key < Right subtree keys",
              "Every node has exactly two children",
              "The tree is completely balanced at every level",
              "Nodes are sorted by insertion timestamp"
            ],
            answerIndex: 0,
            explanation: "In a BST, every node in the left subtree has a key strictly less than the root, and every node in the right subtree has a key strictly greater."
          },
          {
            question: `What is the worst-case time complexity of searching in an unbalanced BST?`,
            options: ["O(log N)", "O(1)", "O(N)", "O(N log N)"],
            answerIndex: 2,
            explanation: "When elements are inserted in already-sorted order, an unbalanced BST degrades into a linear linked list with O(N) traversal time."
          },
          {
            question: `Which tree traversal visits the keys of a Binary Search Tree in ascending sorted order?`,
            options: ["Pre-order traversal", "In-order traversal", "Post-order traversal", "Level-order traversal"],
            answerIndex: 1,
            explanation: "In-order traversal visits (Left, Root, Right), which naturally enumerates BST keys in ascending order."
          }
        ].slice(0, Math.max(1, count))
      };
    }

    return res.status(200).json({
      success: true,
      quiz: quizData,
      assistantMessage: chatResult?.assistantMessage || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Interactive Flashcards Tool Generator: POST /api/v1/ai/tools/flashcards
 */
const generateFlashcards = async (req, res, next) => {
  try {
    const { topic = "Networking & Protocols", count = 5, difficulty = "Medium" } = req.body || {};

    const prompt = `Create ${count} high-yield revision flashcards for the topic: "${topic}".
Difficulty: ${difficulty}.
Return ONLY valid JSON wrapped in a \`\`\`flashcards block with this format:
{
  "deckTitle": "${topic}",
  "difficulty": "${difficulty}",
  "cards": [
    {
      "front": "Concept, term, or question to define",
      "back": "Clear, concise definition or explanation",
      "hint": "Optional quick memory tip"
    }
  ]
}`;

    let deckData = null;
    let chatResult = null;

    try {
      chatResult = await aiService.generateChatResponse(req.userId, {
        messageContent: prompt,
        responseMode: "exam_prep"
      });
      deckData = extractJsonBlock(chatResult.assistantMessage?.content, "flashcards");
    } catch (err) {
      console.warn("[FlashcardsGenerator] AI call warning:", err.message);
    }

    if (!deckData || !Array.isArray(deckData.cards) || deckData.cards.length === 0) {
      deckData = {
        deckTitle: topic,
        difficulty,
        cards: [
          {
            front: "TCP 3-Way Handshake",
            back: "SYN -> SYN-ACK -> ACK establishes a reliable bidirectional TCP connection prior to application data transfer.",
            hint: "Think: Synchronize, Acknowledge"
          },
          {
            front: "TCP vs UDP Core Difference",
            back: "TCP provides connection-oriented, guaranteed in-order packet delivery with flow/congestion control. UDP is connectionless and low-latency without delivery guarantees.",
            hint: "Reliable stream vs Fast datagram"
          },
          {
            front: "OSI Layer 4 Protocol",
            back: "Transport Layer: Responsible for end-to-end communication, segmentation, flow control, and error correction (TCP, UDP).",
            hint: "Host-to-host delivery"
          },
          {
            front: "HTTP Status Code 429",
            back: "Too Many Requests: Rate limiting triggered. The client should back off and inspect the 'Retry-After' header.",
            hint: "Rate limiter threshold hit"
          },
          {
            front: "DNS Resolution Flow",
            back: "Browser Cache -> OS Cache -> Recursive Resolver -> Root Server -> TLD Server -> Authoritative Nameserver.",
            hint: "IP address lookup sequence"
          }
        ].slice(0, Math.max(1, count))
      };
    }

    return res.status(200).json({
      success: true,
      deck: deckData,
      assistantMessage: chatResult?.assistantMessage || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Code Complexity & Architecture Review: POST /api/v1/ai/tools/code-review
 */
const reviewCode = async (req, res, next) => {
  try {
    const { code, language = "javascript" } = req.body || {};
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Source code is required for review." });
    }

    const cleanCode = code.trim().slice(0, 5000);
    const prompt = `Perform an in-depth computer science and software engineering code review on this ${language} code:
\`\`\`${language}
${cleanCode}
\`\`\`

Analyze Big-O time and space complexity, identify potential bugs or edge cases, provide code quality tips, and provide a refactored version.
Return ONLY valid JSON wrapped in a \`\`\`json block adhering to this schema:
{
  "timeComplexity": "O(...)",
  "timeExplanation": "Step-by-step mathematical reasoning...",
  "spaceComplexity": "O(...)",
  "spaceExplanation": "Memory allocation analysis...",
  "bugsAndEdgeCases": ["bug/edge case 1", "bug/edge case 2"],
  "qualitySuggestions": ["quality tip 1", "quality tip 2"],
  "refactoredCode": "// Refactored clean code here"
}`;

    let reviewData = null;
    let chatResult = null;

    try {
      chatResult = await aiService.generateChatResponse(req.userId, {
        messageContent: prompt,
        responseMode: "code_explanation"
      });
      reviewData = extractJsonBlock(chatResult.assistantMessage?.content, "json");
    } catch (err) {
      console.warn("[CodeReview] AI call error:", err.message);
    }

    if (!reviewData || !reviewData.timeComplexity) {
      const hasNestedLoop = /for.*\{[\s\S]*for|while.*\{[\s\S]*while/i.test(cleanCode);
      const hasLoop = /for\s*\(|while\s*\(|\.forEach|\.map|\.reduce/i.test(cleanCode);
      const timeComp = hasNestedLoop ? "O(N²)" : hasLoop ? "O(N)" : "O(1)";
      const spaceComp = cleanCode.includes("new Array") || cleanCode.includes("[]") || cleanCode.includes("push(") ? "O(N)" : "O(1)";

      reviewData = {
        timeComplexity: timeComp,
        timeExplanation: `Detected ${hasNestedLoop ? "nested loop iterations yielding quadratic time complexity" : hasLoop ? "single loop traversal scaling linearly with input size N" : "constant time operations without unbounded loops"}.`,
        spaceComplexity: spaceComp,
        spaceExplanation: `Auxiliary memory allocation ${spaceComp === "O(N)" ? "allocates dynamic collections proportional to input" : "uses constant auxiliary variable pointers"}.`,
        bugsAndEdgeCases: [
          "Validate against null, undefined, or empty inputs before iteration.",
          "Ensure integer bounds and numeric precision are respected."
        ],
        qualitySuggestions: [
          `Leverage idiomatic ${language} functional patterns and strict type checks.`,
          "Break down multi-responsibility logic into cohesive helper methods."
        ],
        refactoredCode: cleanCode
      };
    }

    return res.status(200).json({
      success: true,
      review: reviewData,
      assistantMessage: chatResult?.assistantMessage || null
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
  giveAnother,
  generateImage,
  transcribeAudio,
  synthesizeSpeech,
  uploadDocument,
  submitMessageFeedback,
  toggleSaveMessage,
  generateQuiz,
  generateFlashcards,
  reviewCode
};
