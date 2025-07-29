const { createClient } = require('redis')
const logger = require('../logger')

const redisClient = createClient({
  url: process.env.REDIS_URL
})

redisClient.on('error', (err) => logger.error('Redis error:', err))
redisClient.on('connect', () => logger.info('Redis connected successfully'))

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect()
    } catch (err) {
      logger.error('Redis connection failed:', err)
      throw err
    }
  }
}

module.exports = {
  redisClient,
  connectRedis
}
