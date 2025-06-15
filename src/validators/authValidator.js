const { body } = require('express-validator')

const registerValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('full_name').notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('ktp_number')
    .notEmpty().withMessage('Nomor KTP wajib diisi')
    .isLength({ min: 16, max: 16 }).withMessage('Nomor KTP harus 16 digit')
    .isNumeric().withMessage('Nomor KTP hanya boleh angka'),
  body('birthplace').notEmpty().withMessage('Tempat lahir wajib diisi'),
  body('birthdate').isDate().withMessage('Tanggal lahir tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
]

const loginValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi')
]

module.exports = { registerValidation, loginValidation }
