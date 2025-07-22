const jwt = require('jsonwebtoken')
const moment = require('moment')

const { addToBlacklist } = require('../utils/tokenBlacklist')
const { hashPassword, comparePassword } = require('../utils/hash')
const { pool } = require('../config/db')
const logger = require('../utils/logger')

// REGISTER
const register = async (req, res, next) => {
  const { email, full_name, ktp_number, birthplace, birthdate, password } = req.body

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      logger.security(`Registrasi gagal: Email sudah terdaftar (${email})`)
      return res.status(409).json({ message: 'Email sudah terdaftar' })
    }

    const existingKTP = await pool.query('SELECT id FROM users WHERE ktp_number = $1', [ktp_number])
    if (existingKTP.rows.length > 0) {
      logger.security(`Registrasi gagal: Nomor KTP sudah terdaftar (${ktp_number})`)
      return res.status(409).json({ message: 'Nomor KTP sudah terdaftar' })
    }

    const formattedBirthdate = moment(birthdate, 'DD-MM-YYYY').format('YYYY-MM-DD')
    const password_hash = await hashPassword(password)

    await pool.query(`
      INSERT INTO users (email, full_name, ktp_number, birthplace, birthdate, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [email, full_name, ktp_number, birthplace, formattedBirthdate, password_hash])

    logger.auth(`Registrasi berhasil: ${email}`)
    return res.status(201).json({ message: 'Registrasi berhasil' })
  } catch (err) {
    err.source = 'register'
    next(err)
  }
}

// LOGIN
const login = async (req, res, next) => {
  const { email, password } = req.body

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email tidak ditemukan' })
    }

    const user = result.rows[0]
    const isMatch = await comparePassword(password, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    logger.auth(`Login berhasil: ${email}`)
    return res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      }
    })
  } catch (err) {
    err.source = 'login'
    next(err)
  }
}

// LOGOUT
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(400).json({ message: 'Token tidak ditemukan' })
    }

    const decoded = jwt.decode(token)
    const exp = decoded?.exp * 1000 // ubah ke ms

    if (exp) {
      await addToBlacklist(token, exp)
      logger.auth(`Logout: ${req.user?.email || 'Unknown user'} (token diblacklist)`)
    }

    return res.json({ message: 'Logout berhasil (token diblacklist)' })
  } catch (err) {
    err.source = 'logout'
    next(err)
  }
}

module.exports = { register, login, logout }
