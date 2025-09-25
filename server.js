require('dotenv').config()

const { connectRedis, redisClient } = require('./src/utils/redis/redisClient')
const { pool, connectToDatabase } = require('./src/config/db')
const app = require('./app')
const logger = require('./src/utils/logger')

const PORT = process.env.PORT || 4000

const startServer = async () => {
  // Try to connect to database, but don't fail if it's not ready
  try {
    await connectToDatabase()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`)
    logger.info('Server will start anyway - database can be connected later')
  }

  // Try to connect to Redis, but don't fail if it's not ready
  try {
    await connectRedis()
    logger.info('Redis connected successfully')
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`)
    logger.info('Server will start anyway - Redis is optional')
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`TaniPintar Backend is running!`)
    logger.info(`HTTP Server running on port ${PORT}`)
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`Health check endpoint: http://localhost:${PORT}/health`)
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
