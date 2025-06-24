const rateLimit = require('express-rate-limit')
const fs = require('fs')
const path = require('path')

// Path log file
const logFilePath = path.join(__dirname, '../logs/rate-limit.log')

// Logging function
function logRateLimit(ip, url) {
  const log = `[${new Date().toISOString()}] IP ${ip} exceeded rate limit on ${url}\n`
  fs.appendFile(logFilePath, log, (err) => {
    if (err) console.error('Error writing rate limit log:', err)
  })
}

// Rate limiter setup
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 10, // max 10 request per menit per IP
  handler: (req, res) => {
    logRateLimit(req.ip, req.originalUrl)
    return res.status(429).json({
      status: 'fail',
      message: 'Terlalu banyak permintaan. Coba lagi nanti.',
    })
  },
})

module.exports = limiter
