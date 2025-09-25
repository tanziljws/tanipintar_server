const jwtConfig = require('../config/jwt')
const { isBlacklisted } = require('../utils/redis/tokenBlacklist')
const logger = require('../utils/logger')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Access token tidak ditemukan',
      error: 'MISSING_TOKEN'
    })
  }

  const token = authHeader.split(' ')[1]
  
  try {
    // Verify access token using JWT config
    const decoded = jwtConfig.verifyAccessToken(token)

    // Periksa blacklist berdasarkan JTI (jika ada)
    const jti = decoded.jti
    if (jti && await isBlacklisted(jti)) {
      logger.security(`Blacklisted token access attempt: ${decoded.email}`)
      return res.status(401).json({ 
        message: 'Token tidak valid (sudah logout)',
        error: 'TOKEN_BLACKLISTED'
      })
    }

    // Add user information to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      subject: decoded.sub
    }
    
    logger.api(`Authenticated request: ${decoded.email} - ${req.method} ${req.originalUrl}`)
    next()
    
  } catch (error) {
    logger.security(`Authentication failed: ${error.message} - IP: ${req.ip}`)
    
    // Return specific error messages
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        message: 'Access token telah expired',
        error: 'TOKEN_EXPIRED'
      })
    } else if (error.message.includes('Invalid')) {
      return res.status(401).json({ 
        message: 'Access token tidak valid',
        error: 'INVALID_TOKEN'
      })
    } else {
      return res.status(401).json({ 
        message: 'Gagal memverifikasi token',
        error: 'VERIFICATION_FAILED'
      })
    }
  }
}

module.exports = authMiddleware
