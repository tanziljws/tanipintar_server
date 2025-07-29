const rateLimit = require("express-rate-limit")
const { logLimit } = require("../utils/logger")

const isLocalhost = (ip) => {
  return (
    ip === "::1" || // IPv6 localhost
    ip === "127.0.0.1" || // IPv4 localhost
    ip === "::ffff:127.0.0.1" // IPv4 localhost through IPv6
  )
}

const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 5, // maksimal 5 permintaan login per 5 menit
  skip: (req, res) => isLocalhost(req.ip),
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: "fail",
      message: "Terlalu banyak percobaan login. Coba lagi nanti.",
    })
  },
})

const refreshRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10, // maksimal 10 permintaan refresh per menit
  skip: (req, res) => isLocalhost(req.ip),
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: "fail",
      message: "Terlalu sering me-refresh token. Coba lagi sebentar lagi.",
    })
  },
})

const registerRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 hari
  max: 3, // maksimal 3 permintaan register per hari
  skip: (req, res) => isLocalhost(req.ip),
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: "fail",
      message: "Terlalu banyak pendaftaran. Coba lagi nanti.",
    })
  },
})

module.exports = {
  loginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter
}
