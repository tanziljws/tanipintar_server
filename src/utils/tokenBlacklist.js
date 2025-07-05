const { createClient } = require('redis')
const logger = require('./logger')

const redisClient = createClient({
  url: process.env.REDIS_URL
})

redisClient.on('error', (err) => logger.error('Redis Error:', err))
redisClient.on('connect', () => logger.info('Redis connected successfully'))

const connectRedis = async () => {
  try {
    await redisClient.connect()
  } catch (err) {
    logger.error('Redis connection failed:', err)
  }
}

const addToBlacklist = async (token, exp) => {
  const ttl = Math.floor((exp - Date.now()) / 1000) // dalam detik
  await redisClient.set(`bl_${token}`, '1', { EX: ttl })
}

const isBlacklisted = async (token) => {
  const result = await redisClient.get(`bl_${token}`)
  return result === '1'
}

module.exports = { connectRedis, addToBlacklist, isBlacklisted }
