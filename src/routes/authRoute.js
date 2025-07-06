const express = require('express')
const router = express.Router()

const { register, login, logout } = require('../controllers/authController')
const { registerValidation, loginValidation } = require('../validators/authValidator')
const { registerRateLimiter, loginRateLimiter } = require('../middlewares/rateLimiter')

const authMiddleware = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validate')

// AUTH
router.post('/register', registerRateLimiter, registerValidation, validate, register)
router.post('/login', loginRateLimiter, loginValidation, validate, login)
router.post('/logout', authMiddleware, logout)

module.exports = router
