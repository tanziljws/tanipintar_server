const express = require("express")
const ChatbotController = require("../controllers/chatbotController")
const {
    validateSendMessage,
    validateClearConversation,
    validateDeleteSession,
} = require("../validators/chatbotValidator")

const router = express.Router()
const chatbotController = new ChatbotController()

// POST /api/chatbot/message - Mengirim pesan ke chatbot
router.post("/message", validateSendMessage, (req, res) => chatbotController.sendMessage(req, res))

// POST /api/chatbot/clear - Membersihkan riwayat percakapan
router.post("/clear", validateClearConversation, (req, res) => chatbotController.clearConversation(req, res))

// GET /api/chatbot/status - Mendapatkan status chatbot
router.get("/status", (req, res) => chatbotController.getStatus(req, res))

// DELETE /api/chatbot/session/:sessionId - Menghapus session chatbot
router.delete("/session/:sessionId", validateDeleteSession, (req, res) => chatbotController.deleteSession(req, res))

module.exports = router
