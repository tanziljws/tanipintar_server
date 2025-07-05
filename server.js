require('dotenv').config()

const fs = require('fs')
const https = require('https')
const path = require('path')

const { connectRedis } = require('./src/utils/tokenBlacklist')
const { pool, connectToDatabase } = require('./src/config/db')
const app = require('./app')
const logger = require('./src/utils/logger')

const PORT = process.env.PORT || 4000

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
}

const startServer = async () => {
  await connectToDatabase()
  await connectRedis()

  const server = https.createServer(sslOptions, app).listen(PORT, () => {
    logger.info(`✅ HTTPS Server running at https://localhost:${PORT}`)
  })

  const shutdown = () => {
    logger.info('Shutting down gracefully...')
    server.close(() => {
      logger.info('HTTPS server closed')
      pool.end()
        .then(() => {
          logger.info('Database pool has ended')
          setTimeout(() => process.exit(0), 200)
        })
        .catch((err) => {
          logger.error(`Error closing DB pool: ${err}`)
          setTimeout(() => process.exit(1), 200)
        })
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

startServer()
