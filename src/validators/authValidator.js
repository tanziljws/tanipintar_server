const { body } = require('express-validator')

const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .bail()
    .isEmail().withMessage('Email tidak valid')
    .bail()
    .isLength({ max: 100 }).withMessage('Email tidak boleh lebih dari 100 karakter')
    .bail()
    .customSanitizer(value => value.toLowerCase())
    .normalizeEmail(),

  body('full_name')
    .trim()
    .notEmpty().withMessage('Nama lengkap wajib diisi')
    .bail()
    .isLength({ min: 2, max: 100 }).withMessage('Nama lengkap harus 2-100 karakter')
    .bail()
    .matches(/^[a-zA-Z\s.]+$/).withMessage('Nama hanya boleh huruf, spasi, dan titik')
    .custom(name => {
      const blacklist = ['admin', 'test', 'null']
      if (blacklist.includes(name.toLowerCase())) {
        throw new Error('Nama tidak diperbolehkan')
      }
      return true
    }),

  body('ktp_number')
    .trim()
    .notEmpty().withMessage('Nomor KTP wajib diisi')
    .bail()
    .isLength({ min: 16, max: 16 }).withMessage('Nomor KTP harus 16 digit')
    .bail()
    .isNumeric().withMessage('Nomor KTP hanya boleh angka')
    .bail()
    .custom(value => {
      if (!/^([1-9]\d{15})$/.test(value)) {
        throw new Error('Nomor KTP tidak valid')
      }
      return true
    }),

  body('birthplace')
    .trim()
    .notEmpty().withMessage('Tempat lahir wajib diisi')
    .bail()
    .isLength({ min: 2, max: 50 }).withMessage('Tempat lahir harus 2-50 karakter')
    .bail()
    .matches(/^[a-zA-Z\s.]+$/).withMessage('Tempat lahir hanya boleh huruf, spasi, dan titik'),

  body('birthdate')
    .trim()
    .notEmpty().withMessage('Tanggal lahir wajib diisi')
    .bail()
    .custom((value) => {
      const regex = /^(\d{2})-(\d{2})-(\d{4})$/
      if (!regex.test(value)) {
        throw new Error('Format tanggal harus DD-MM-YYYY')
      }

      const [_, day, month, year] = value.match(regex)
      const birthdate = new Date(`${year}-${month}-${day}`)

      if (isNaN(birthdate.getTime())) {
        throw new Error('Tanggal lahir tidak valid')
      }

      const today = new Date()
      if (birthdate > today) {
        throw new Error('Tanggal lahir tidak boleh di masa depan')
      }

      const ageDiff = today.getFullYear() - birthdate.getFullYear()
      const monthDiff = today.getMonth() - birthdate.getMonth()
      const dayDiff = today.getDate() - birthdate.getDate()

      const isUnder17 =
        ageDiff < 17 ||
        (ageDiff === 17 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))

      if (isUnder17) {
        throw new Error('Usia minimal 17 tahun')
      }

      return true
    }),

  body('password')
    .trim()
    .notEmpty().withMessage('Password wajib diisi')
    .bail()
    .isLength({ min: 6, max: 64 }).withMessage('Password harus 6-64 karakter')
    .bail()
    .matches(/^\S+$/).withMessage('Password tidak boleh mengandung spasi')
    .bail()
    .custom(value => {
      const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123']
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Gunakan password yang lebih kuat dan tidak umum')
      }
      return true
    })
]

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .bail()
    .isEmail().withMessage('Format email tidak valid')
    .bail()
    .isLength({ max: 100 }).withMessage('Email tidak boleh lebih dari 100 karakter')
    .bail()
    .customSanitizer(value => value.toLowerCase())
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty().withMessage('Password wajib diisi')
    .bail()
    .isLength({ min: 6, max: 64 }).withMessage('Password harus 6-64 karakter')
    .bail()
    .matches(/^\S+$/).withMessage('Password tidak boleh mengandung spasi')
]

module.exports = { registerValidation, loginValidation }
