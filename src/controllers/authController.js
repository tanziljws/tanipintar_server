const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const { hashPassword, comparePassword } = require('../utils/hash')

// REGISTER
const register = async (req, res) => {
  const { email, full_name, ktp_number, birthplace, birthdate, password } = req.body

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' })
    }

    const existingKTP = await pool.query('SELECT id FROM users WHERE ktp_number = $1', [ktp_number])
    if (existingKTP.rows.length > 0) {
      return res.status(400).json({ message: 'Nomor KTP sudah terdaftar' })
    }

    const password_hash = await hashPassword(password)

    await pool.query(`
      INSERT INTO users (email, full_name, ktp_number, birthplace, birthdate, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [email, full_name, ktp_number, birthplace, birthdate, password_hash])

    return res.status(201).json({ message: 'Registrasi berhasil' })
  } catch (err) {
    console.error('Register error:', err.message)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' })
  }
}

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Email tidak ditemukan' })
    }

    const user = result.rows[0]
    const isMatch = await comparePassword(password, user.password_hash)
    if (!isMatch) {
      return res.status(400).json({ message: 'Password salah' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set token sebagai cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      }
    })
  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' })
  }
}

// LOGOUT
const logout = (req, res) => {
  res.clearCookie('token')
  return res.json({ message: 'Logout berhasil' })
}

module.exports = { register, login, logout }
