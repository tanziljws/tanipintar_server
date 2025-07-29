const { redisClient } = require('./redisClient')

const addToBlacklist = async (jti, exp) => {
  const ttl = Math.floor((exp - Date.now()) / 1000)
  await redisClient.set(`bl_${jti}`, '1', { EX: ttl })
}

const isBlacklisted = async (jti) => {
  const result = await redisClient.get(`bl_${jti}`)
  return result === '1'
}

module.exports = { addToBlacklist, isBlacklisted }
