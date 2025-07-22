const ChatbotService = require("../services/chatbotService")
const logger = require("../utils/logger")

class ChatbotController {
    constructor() {
        // Store active chatbot sessions (seperti di Flutter screen)
        this.sessions = new Map()
    }

    /**
     * Mendapatkan atau membuat session chatbot
     */
    _getOrCreateSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, new ChatbotService())
            logger.chatbot(`New session created: ${sessionId}`)
        }
        return this.sessions.get(sessionId)
    }

    /**
     * Mengirim pesan ke chatbot
     * Endpoint: POST /api/chatbot/message
     */
    async sendMessage(req, res) {
        try {
            const { message, sessionId = "default" } = req.body
            logger.api(`Chatbot message request from session: ${sessionId}`)

            if (!message) {
                return res.status(400).json({
                    status: "fail",
                    message: "Pesan harus disediakan",
                })
            }

            const chatbot = this._getOrCreateSession(sessionId)

            if (!chatbot.isConfigured) {
                return res.status(500).json({
                    status: "error",
                    message: "Chatbot belum dikonfigurasi dengan benar. Periksa API key dan model.",
                })
            }

            const response = await chatbot.sendMessage(message)

            res.json({
                status: "success",
                message: "Pesan berhasil dikirim",
                data: {
                    response,
                    sessionId,
                    model: chatbot.currentModel,
                    timestamp: new Date().toISOString(),
                },
            })
        } catch (error) {
            logger.error(`Error in sendMessage: ${error.message}`)
            res.status(500).json({
                status: "error",
                message: "Gagal mengirim pesan ke chatbot",
            })
        }
    }

    /**
     * Membersihkan riwayat percakapan
     * Endpoint: POST /api/chatbot/clear
     */
    async clearConversation(req, res) {
        try {
            const { sessionId = "default" } = req.body
            logger.api(`Clear conversation request for session: ${sessionId}`)

            const chatbot = this._getOrCreateSession(sessionId)
            chatbot.clearConversation()

            res.json({
                status: "success",
                message: "Riwayat percakapan berhasil dibersihkan",
                data: { sessionId },
            })
        } catch (error) {
            logger.error(`Error in clearConversation: ${error.message}`)
            res.status(500).json({
                status: "error",
                message: "Gagal membersihkan riwayat percakapan",
            })
        }
    }

    /**
     * Mendapatkan status chatbot
     * Endpoint: GET /api/chatbot/status
     */
    async getStatus(req, res) {
        try {
            const { sessionId = "default" } = req.query

            const chatbot = this._getOrCreateSession(sessionId)

            res.json({
                status: "success",
                message: "Status chatbot berhasil diambil",
                data: {
                    isConfigured: chatbot.isConfigured,
                    model: chatbot.currentModel,
                    messageCount: chatbot.messages.length,
                    sessionId,
                },
            })
        } catch (error) {
            logger.error(`Error in getStatus: ${error.message}`)
            res.status(500).json({
                status: "error",
                message: "Gagal mendapatkan status chatbot",
            })
        }
    }

    /**
     * Menghapus session chatbot
     * Endpoint: DELETE /api/chatbot/session/:sessionId
     */
    async deleteSession(req, res) {
        try {
            const { sessionId } = req.params

            if (!sessionId) {
                return res.status(400).json({
                    status: "fail",
                    message: "Session ID harus disediakan",
                })
            }

            const deleted = this.sessions.delete(sessionId)
            logger.chatbot(`Session ${sessionId} ${deleted ? "deleted" : "not found"}`)

            res.json({
                status: "success",
                message: deleted ? "Session berhasil dihapus" : "Session tidak ditemukan",
                data: { sessionId },
            })
        } catch (error) {
            logger.error(`Error in deleteSession: ${error.message}`)
            res.status(500).json({
                status: "error",
                message: "Gagal menghapus session",
            })
        }
    }
}

module.exports = ChatbotController
