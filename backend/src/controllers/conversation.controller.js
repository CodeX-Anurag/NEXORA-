const conversationService = require("../services/conversation.service");
const aiService = require("../services/ai.service");

const getConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getConversations(req.userId);
    return res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.createConversation(req.userId, req.body);
    return res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const data = await conversationService.getMessages(req.userId, req.params.id);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const result = await aiService.generateChatResponse(req.userId, {
      conversationId: req.params.id,
      messageContent: content
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  addMessage
};
