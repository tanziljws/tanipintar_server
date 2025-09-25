require('dotenv').config()
const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

class JWTConfig {
    constructor() {
        // Validate required JWT environment variables
        this.validateJWTEnv()
        
        this.accessTokenSecret = process.env.JWT_SECRET
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET
        this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '1h'
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        this.issuer = process.env.JWT_ISSUER || 'tanipintar-backend'
        this.audience = process.env.JWT_AUDIENCE || 'tanipintar-mobile'
    }

    validateJWTEnv() {
        const requiredJWTEnv = ['JWT_SECRET', 'JWT_REFRESH_SECRET']
        
        requiredJWTEnv.forEach(key => {
            if (!process.env[key]) {
                throw new Error(`Missing required JWT environment variable: ${key}`)
            }
            
            // Check minimum length for security
            if (process.env[key].length < 32) {
                throw new Error(`JWT environment variable ${key} must be at least 32 characters long`)
            }
        })
        
        logger.info('JWT configuration validated successfully')
    }

    /**
     * Generate Access Token
     * @param {Object} payload - User data to include in token
     * @param {string} payload.userId - User ID
     * @param {string} payload.email - User email
     * @param {string} payload.name - User name
     * @returns {string} JWT access token
     */
    generateAccessToken(payload) {
        try {
            const tokenPayload = {
                userId: payload.userId,
                email: payload.email,
                name: payload.name,
                type: 'access'
            }

            const options = {
                expiresIn: this.accessTokenExpiry,
                issuer: this.issuer,
                audience: this.audience,
                subject: payload.userId.toString()
            }

            const token = jwt.sign(tokenPayload, this.accessTokenSecret, options)
            logger.info(`Access token generated for user: ${payload.email}`)
            
            return token
        } catch (error) {
            logger.error(`Error generating access token: ${error.message}`)
            throw new Error('Failed to generate access token')
        }
    }

    /**
     * Generate Refresh Token
     * @param {Object} payload - User data to include in token
     * @param {string} payload.userId - User ID
     * @param {string} payload.email - User email
     * @returns {string} JWT refresh token
     */
    generateRefreshToken(payload) {
        try {
            const tokenPayload = {
                userId: payload.userId,
                email: payload.email,
                type: 'refresh'
            }

            const options = {
                expiresIn: this.refreshTokenExpiry,
                issuer: this.issuer,
                audience: this.audience,
                subject: payload.userId.toString()
            }

            const token = jwt.sign(tokenPayload, this.refreshTokenSecret, options)
            logger.info(`Refresh token generated for user: ${payload.email}`)
            
            return token
        } catch (error) {
            logger.error(`Error generating refresh token: ${error.message}`)
            throw new Error('Failed to generate refresh token')
        }
    }

    /**
     * Verify Access Token
     * @param {string} token - JWT access token to verify
     * @returns {Object} Decoded token payload
     */
    verifyAccessToken(token) {
        try {
            const options = {
                issuer: this.issuer,
                audience: this.audience
            }

            const decoded = jwt.verify(token, this.accessTokenSecret, options)
            
            // Validate token type
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type')
            }

            return decoded
        } catch (error) {
            logger.error(`Access token verification failed: ${error.message}`)
            
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token has expired')
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid access token')
            } else {
                throw new Error('Access token verification failed')
            }
        }
    }

    /**
     * Verify Refresh Token
     * @param {string} token - JWT refresh token to verify
     * @returns {Object} Decoded token payload
     */
    verifyRefreshToken(token) {
        try {
            const options = {
                issuer: this.issuer,
                audience: this.audience
            }

            const decoded = jwt.verify(token, this.refreshTokenSecret, options)
            
            // Validate token type
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type')
            }

            return decoded
        } catch (error) {
            logger.error(`Refresh token verification failed: ${error.message}`)
            
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token has expired')
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token')
            } else {
                throw new Error('Refresh token verification failed')
            }
        }
    }

    /**
     * Generate Token Pair (Access + Refresh)
     * @param {Object} payload - User data
     * @returns {Object} Object containing access and refresh tokens
     */
    generateTokenPair(payload) {
        const accessToken = this.generateAccessToken(payload)
        const refreshToken = this.generateRefreshToken(payload)

        // Calculate expiration times
        const accessTokenExpires = new Date(Date.now() + this.parseExpiry(this.accessTokenExpiry))
        const refreshTokenExpires = new Date(Date.now() + this.parseExpiry(this.refreshTokenExpiry))

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: this.parseExpiry(this.accessTokenExpiry) / 1000, // in seconds
            accessTokenExpires: accessTokenExpires.toISOString(),
            refreshTokenExpires: refreshTokenExpires.toISOString()
        }
    }

    /**
     * Parse expiry string to milliseconds
     * @param {string} expiry - Expiry string (e.g., '1h', '7d', '30m')
     * @returns {number} Expiry in milliseconds
     */
    parseExpiry(expiry) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        }

        const match = expiry.match(/^(\d+)([smhd])$/)
        if (!match) {
            throw new Error(`Invalid expiry format: ${expiry}`)
        }

        const [, amount, unit] = match
        return parseInt(amount) * units[unit]
    }

    /**
     * Decode token without verification (for debugging)
     * @param {string} token - JWT token
     * @returns {Object} Decoded token
     */
    decodeToken(token) {
        try {
            return jwt.decode(token, { complete: true })
        } catch (error) {
            logger.error(`Token decode failed: ${error.message}`)
            throw new Error('Failed to decode token')
        }
    }
}

// Export singleton instance
module.exports = new JWTConfig()
