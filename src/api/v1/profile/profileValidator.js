const { body } = require('express-validator')

const updateProfileValidation = [
  body('email').notEmpty().withMessage('Emai wajib diisi')
]

module.exports = { updateProfileValidation }