const express = require('express')
const router = express.Router()
const { register, login, logout } = require('../controllers/authController')
const { registerValidation, loginValidation } = require('../validators/authValidator')
const validate = require('../middlewares/validate')

router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
router.post('/logout', logout)

module.exports = router
