const express = require('express')
const router = express.Router()

const { register, login, logout } = require('../controllers/authController')
const { registerValidation, loginValidation } = require('../validators/authValidator')
const validate = require('../middlewares/validate')
const rateLimiter = require('../middlewares/rateLimiter')

router.post('/register', rateLimiter, registerValidation, validate, register)
router.post('/login', rateLimiter, loginValidation, validate, login)
router.post('/logout', logout)

module.exports = router
