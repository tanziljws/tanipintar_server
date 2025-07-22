const { chatbotRateLimiter, weatherRateLimiter, generalApiRateLimiter } = require("./rateLimiter")

/**
 * Middleware untuk apply rate limiting berdasarkan route
 */
const applyRateLimit = (req, res, next) => {
    const path = req.path

    if (path.startsWith("/api/chatbot")) {
        return chatbotRateLimiter(req, res, next)
    } else if (path.startsWith("/api/weather")) {
        return weatherRateLimiter(req, res, next)
    } else {
        return generalApiRateLimiter(req, res, next)
    }
}

module.exports = applyRateLimit
