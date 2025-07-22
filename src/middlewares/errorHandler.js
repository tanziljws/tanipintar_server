const logger = require("../utils/logger")

const errorHandler = (err, req, res, next) => {
  // Log error dengan source information
  const source = err.source || "unknown"
  logger.error(`[ERROR] ${source}: ${err.message}`)

  // Handle specific error types untuk chatbot dan weather
  let statusCode = err.statusCode || 500
  let message = "Terjadi kesalahan pada server"

  if (err.code === "ECONNREFUSED") {
    message = "Tidak dapat terhubung ke layanan eksternal"
    statusCode = 503
  } else if (err.response && err.response.status) {
    // Axios error dari external API (OpenAI, Weather API)
    statusCode = err.response.status
    if (statusCode === 401) {
      message = "API key tidak valid atau expired"
    } else if (statusCode === 429) {
      message = "Terlalu banyak request ke layanan eksternal"
    } else if (statusCode >= 500) {
      message = "Layanan eksternal sedang bermasalah"
    }
  } else if (source === "weather") {
    message = "Gagal mendapatkan data cuaca"
  } else if (source === "chatbot") {
    message = "Gagal menghubungi asisten AI"
  }

  res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && { detail: err.message }),
  })
}

module.exports = errorHandler
