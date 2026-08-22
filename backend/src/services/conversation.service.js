const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");

/**
 * Get all conversations for authenticated user
 */
const getConversations = async (userId) => {
  return await Conversation.find({ userId }).sort({ updatedAt: -1 }).lean();
};

/**
 * Create a new conversation
 */
const createConversation = async (userId, { title }) => {
  const conversation = await Conversation.create({
    userId,
    title: title ? title.trim() : "New AI Coach Session"
  });
  return conversation;
};

/**
 * Get messages for a specific conversation (scoped to authenticated user)
 */
const getMessages = async (userId, conversationId) => {
  const conversation = await Conversation.findOne({ _id: conversationId, userId }).lean();
  if (!conversation) {
    const err = new Error("Conversation not found or access denied.");
    err.statusCode = 404;
    throw err;
  }

  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
  return {
    conversation,
    messages
  };
};

module.exports = {
  getConversations,
  createConversation,
  getMessages
};
