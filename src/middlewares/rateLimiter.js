const rateLimit = require('express-rate-limit')
const logger = require('../utils/logger')

const isLocalhost = (ip) => {
  return (
    ip === '::1' ||        // IPv6 localhost
    ip === '127.0.0.1' ||  // IPv4 localhost
    ip === '::ffff:127.0.0.1' // IPv4 localhost through IPv6
  )
}

const logLimit = (req) => {
  logger.warn(`[RateLimit] IP: ${req.ip}, URL: ${req.originalUrl}, Agent: ${req.headers['user-agent']}`)
}

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 menit
  max: 5,
  skip: (req, res) => isLocalhost(req.ip), // <- SKIP LIMIT jika localhost
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: 'fail',
      message: 'Terlalu banyak percobaan login. Coba lagi nanti.',
    })
  }
})

const registerRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  skip: (req, res) => isLocalhost(req.ip), // <- SKIP LIMIT jika localhost
  handler: (req, res) => {
    logLimit(req)
    return res.status(429).json({
      status: 'fail',
      message: 'Terlalu banyak pendaftaran. Coba lagi nanti.',
    })
  }
})

module.exports = {
  registerRateLimiter,
  loginRateLimiter
}
