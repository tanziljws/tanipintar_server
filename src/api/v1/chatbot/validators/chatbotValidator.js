const { body, query, param, validationResult } = require("express-validator")

/**
 * Validator untuk send message
 */
const validateSendMessage = [
    body("message")
        .notEmpty()
        .withMessage("Pesan tidak boleh kosong")
        .isLength({ min: 1, max: 1000 })
        .withMessage("Pesan harus antara 1-1000 karakter"),

    body("sessionId")
        .optional()
        .isString()
        .withMessage("Session ID harus berupa string")
        .isLength({ min: 1, max: 100 })
        .withMessage("Session ID maksimal 100 karakter"),

    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "fail",
                message: "Data yang dikirim tidak valid",
                errors: errors.array(),
            })
        }
        next()
    },
]

/**
 * Validator untuk clear conversation
 */
const validateClearConversation = [
    body("sessionId")
        .optional()
        .isString()
        .withMessage("Session ID harus berupa string")
        .isLength({ min: 1, max: 100 })
        .withMessage("Session ID maksimal 100 karakter"),

    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "fail",
                message: "Data yang dikirim tidak valid",
                errors: errors.array(),
            })
        }
        next()
    },
]

/**
 * Validator untuk delete session
 */
const validateDeleteSession = [
    param("sessionId")
        .notEmpty()
        .withMessage("Session ID tidak boleh kosong")
        .isString()
        .withMessage("Session ID harus berupa string")
        .isLength({ min: 1, max: 100 })
        .withMessage("Session ID maksimal 100 karakter"),

    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "fail",
                message: "Data yang dikirim tidak valid",
                errors: errors.array(),
            })
        }
        next()
    },
]

module.exports = {
    validateSendMessage,
    validateClearConversation,
    validateDeleteSession,
}
