const express = require('express')
const router = express.Router()

const { getProfile, updateProfile } = require('./profileController')
const { updateProfileValidation } = require('./profileValidator')
const authMiddleware = require('../../../middlewares/authMiddleware')

router.get('/', authMiddleware, getProfile)
router.put('/', authMiddleware, updateProfileValidation, updateProfile)

module.exports = router