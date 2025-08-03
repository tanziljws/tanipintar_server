require('dotenv').config()

const { connectRedis, redisClient } = require('./src/utils/redis/redisClient')
const { pool, connectToDatabase } = require('./src/config/db')
const app = require('./app')
const logger = require('./src/utils/logger')

const PORT = process.env.PORT || 4000

const startServer = async () => {
  await connectToDatabase()
  await connectRedis()

  const server = app.listen(PORT, '', () => {
    logger.info(`HTTP Server running on port ${PORT}`)
  })

  let isShuttingDown = false
  const shutdown = () => {
    if (isShuttingDown) return
    isShuttingDown = true

    logger.info('Shutting down gracefully...')

    server.close(async () => {
      logger.info('HTTP server closed')

      // 1. Close PostgreSQL pool
      try {
        await pool.end()
        logger.info('Database pool has ended')
      } catch (err) {
        logger.error(`Error closing DB pool: ${err}`)
      }

      // 2. Close Redis client
      try {
        if (redisClient.isOpen) {
          await redisClient.quit()
          logger.info('Redis client disconnected')
        }
      } catch (err) {
        logger.error(`Error disconnecting Redis: ${err}`)
      }

      // 3. Exit after cleanup
      setTimeout(() => process.exit(0), 200)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

startServer()
.catch(err => {
  logger.error(`Failed to start server: ${err}`)
  process.exit(1)
})
