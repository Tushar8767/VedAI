const { handleChatMessage } = require("../services/chatService");
const chatRepository = require("../repositories/chatRepository");
const { isConnected } = require("../database/db");

async function sendMessage(req, res) {
  try {
    const { message, conversationId } = req.body || {};
    const userId = req.user ? req.user.id : null;

    const result = await handleChatMessage({
      userId,
      conversationId,
      message
    });

    res.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(error.statusCode || 500).json({
      error: {
        code: "CHAT_ERROR",
        message: error.message || "Failed to process chat message."
      }
    });
  }
}

async function getMessages(req, res) {
  const { conversationId } = req.params;
  if (!isConnected()) {
    return res.json({ messages: [] });
  }

  try {
    const messages = await chatRepository.getMessages(conversationId);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: { code: "CHAT_ERROR", message: "Failed to load messages." } });
  }
}

module.exports = { sendMessage, getMessages };
