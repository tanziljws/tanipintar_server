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
    .custom(name => {
      const cleaned = name.toLowerCase()
      const blacklist = ['admin', 'test', 'null']

      for (const word of blacklist) {
        if (cleaned.includes(word)) {
          throw new Error('Nama tidak diperbolehkan')
        }
      }

      if (cleaned.replace(/\s+/g, '').length < 4) {
        throw new Error('Nama terlalu pendek, minimal 4 karakter')
      }

      if (/([a-zA-Z])\1{4,}/.test(cleaned)) {
        throw new Error('Nama tidak boleh huruf yang sama berulang terlalu banyak')
      }

      if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(cleaned)) {
        throw new Error('Nama terlalu banyak konsonan berurutan, tidak valid')
      }

      if (cleaned.length > 100) {
        throw new Error('Nama terlalu panjang, maksimal 100 karakter')
      }

      return true
    })
    .bail()
    .matches(/^[a-zA-Z\s.]+$/).withMessage('Nama hanya boleh huruf, spasi, dan titik'),


  body('ktp_number')
    .trim()
    .notEmpty().withMessage('Nomor KTP wajib diisi')
    .bail()
    .isNumeric().withMessage('Nomor KTP hanya boleh angka')
    .bail()
    .isLength({ min: 16, max: 16 }).withMessage('Nomor KTP harus 16 digit')
    .bail()
    .custom(value => {
      if (!/^([1-9]\d{15})$/.test(value)) {
        throw new Error('Nomor KTP tidak boleh diawali dengan angka 0')
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

const updateProfileValidation = [
  body('email').notEmpty().withMessage('Emai wajib diisi')
]

module.exports = { registerValidation, loginValidation, updateProfileValidation }
