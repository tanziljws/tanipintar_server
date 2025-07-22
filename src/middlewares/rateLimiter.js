const rateLimit = require("express-rate-limit")
const { logLimit } = require("../utils/logger")

const isLocalhost = (ip) => {
  return (
    ip === "::1" || // IPv6 localhost
    ip === "127.0.0.1" || // IPv4 localhost
    ip === "::ffff:127.0.0.1" // IPv4 localhost through IPv6
  )
}

// Existing rate limiters dari file asli Anda
const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5,
  skip: (req, res) => isLocalhost(req.ip),
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: "fail",
      message: "Terlalu banyak percobaan login. Coba lagi nanti.",
    })
  },
})

const registerRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  skip: (req, res) => isLocalhost(req.ip),
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: "fail",
      message: "Terlalu banyak pendaftaran. Coba lagi nanti.",
    })
  },
})

// New rate limiters untuk chatbot dan weather
const chatbotRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 50, // maksimal 50 request per 15 menit
  skip: (req, res) => isLocalhost(req.ip),
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: "fail",
      message: "Terlalu banyak request ke chatbot. Silakan coba lagi nanti.",
    })
  },
})

const weatherRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // maksimal 100 request per 15 menit
  skip: (req, res) => isLocalhost(req.ip),
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: "fail",
      message: "Terlalu banyak request ke weather API. Silakan coba lagi nanti.",
    })
  },
})

module.exports = {
  registerRateLimiter,
  loginRateLimiter,
  chatbotRateLimiter,
  weatherRateLimiter,
}
