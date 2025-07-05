const jwt = require('jsonwebtoken')
const { isBlacklisted } = require('../utils/tokenBlacklist')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' })
  }

  const token = authHeader.split(' ')[1]

  if (await isBlacklisted(token)) {
    return res.status(401).json({ message: 'Token tidak valid (sudah logout)' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid' })
  }
}

module.exports = authMiddleware
