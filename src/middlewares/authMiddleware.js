const jwt = require('jsonwebtoken')
const { isBlacklisted } = require('../utils/redis/tokenBlacklist')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Periksa blacklist berdasarkan JTI
    const jti = decoded.jti
    if (await isBlacklisted(jti)) {
      return res.status(401).json({ message: 'Token tidak valid (sudah logout)' })
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid' })
  }
}

module.exports = authMiddleware
