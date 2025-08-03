const express = require('express')
const router = express.Router()

const { register, login, logout, refreshToken } = require('./authController')
const { registerValidation, loginValidation } = require('./authValidator')
const { registerRateLimiter, loginRateLimiter, refreshRateLimiter } = require('../../../middlewares/rateLimiter')

const authMiddleware = require('../../../middlewares/authMiddleware')
const validate = require('../../../middlewares/validate')

router.post('/register', registerRateLimiter, registerValidation, validate, register)
router.post('/login', loginRateLimiter, loginValidation, validate, login)
router.post('/refresh-token', refreshRateLimiter, refreshToken)
router.post('/logout', authMiddleware, logout)

module.exports = router
