const express = require('express')
const router = express.Router()

const { getProfile, updateProfile } = require('../controllers/profileController')
const { updateProfileValidation } = require('../validators/profileValidator')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/', authMiddleware, getProfile)
router.put('/', authMiddleware, updateProfileValidation, updateProfile)

module.exports = router