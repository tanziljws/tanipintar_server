const express = require('express')
const router = express.Router()

const { register, login, logout, getProfile, updateProfile } = require('../controllers/authController')
const { registerValidation, loginValidation, updateProfileValidation } = require('../validators/authValidator')
const { registerRateLimiter, loginRateLimiter } = require('../middlewares/rateLimiter')

const authMiddleware = require('../middlewares/authMiddleware')
const validate = require('../middlewares/validate')

// AUTH
router.post('/register', registerRateLimiter, registerValidation, validate, register)
router.post('/login', loginRateLimiter, loginValidation, validate, login)

// PROFILE
router.post('/logout', authMiddleware, logout)
router.get('/profile', authMiddleware, getProfile)
router.put('/profile', authMiddleware, updateProfileValidation, updateProfile)

module.exports = router
