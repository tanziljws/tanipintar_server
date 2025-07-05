const logger = require('../utils/logger')

const errorHandler = (err, req, res, next) => {
  logger.error(`[ERROR] ${err.source || 'unknown'}: ${err.message}`)

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { detail: err.message }) // hanya tampil di dev
  })
}

module.exports = errorHandler
