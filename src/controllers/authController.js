const jwt = require('jsonwebtoken')
const { parse, format } = require('date-fns')

const { v4: uuidv4 } = require('uuid')
const { addToBlacklist } = require('../utils/redis/tokenBlacklist')
const { hashPassword, comparePassword } = require('../utils/hash')
const { redisClient } = require('../utils/redis/redisClient')
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

    const parsedBirthdate = parse(birthdate, 'dd-MM-yyyy', new Date())
    const formattedBirthdate = format(parsedBirthdate, 'yyyy-MM-dd')

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

    const jti = uuidv4()

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, jti },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, jti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    await redisClient.set(`refresh_${jti}`, refreshToken, { EX: 7 * 24 * 60 * 60 })

    logger.auth(`Login berhasil: ${email}`)
    return res.json({
      message: 'Login berhasil',
      access_token: accessToken,
      refresh_token: refreshToken,
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

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      logger.security(`Logout gagal: token tidak valid atau kadaluwarsa (${err.message})`)
      return res.status(401).json({ message: 'Token tidak valid atau kadaluwarsa' })
    }

    const jti = decoded.jti
    const exp = decoded.exp * 1000

    // Optional: pengecekan manual expiry
    if (Date.now() > exp) {
      logger.security(`Logout: token sudah kadaluwarsa (JTI: ${jti})`)
      return res.status(400).json({ message: 'Token sudah kedaluwarsa' })
    }

    // Tambahkan ke blacklist dan hapus refresh token dari Redis
    await addToBlacklist(jti, exp)
    await redisClient.del(`refresh_${jti}`)

    logger.auth(`Logout: ${decoded.email} (JTI: ${jti} diblacklist)`)

    return res.json({ message: 'Logout berhasil' })
  } catch (err) {
    err.source = 'logout'
    next(err)
  }
}

// REFRESH TOKEN
const refreshToken = async (req, res, next) => {
  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(401).json({ message: 'Refresh token tidak ditemukan' })
  }

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET)
    const oldJti = decoded.jti

    // 1. Pastikan token ada di Redis (rotating logic utama)
    const storedToken = await redisClient.get(`refresh_${oldJti}`)
    if (!storedToken) {
      logger.security(`Refresh token tidak berlaku atau sudah digunakan (JTI: ${oldJti}, email: ${decoded.email})`)
      return res.status(403).json({ message: 'Refresh token sudah tidak berlaku (sudah digunakan atau kedaluwarsa)' })
    }

    // 2. Cegah replay attack
    if (storedToken !== refresh_token) {
      // Jika token sama jti-nya tapi value beda → reuse!
      logger.security(`Refresh token reuse terdeteksi (JTI ${oldJti}, email: ${decoded.email})`)
      return res.status(403).json({ message: 'Refresh token tidak valid (kemungkinan reuse)' })
    }

    // 3. Blacklist token lama
    await addToBlacklist(oldJti, decoded.exp * 1000)

    // 4. Generate JTI baru dan token baru
    const newJti = uuidv4()

    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, jti: newJti },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const newRefreshToken = jwt.sign(
      { id: decoded.id, email: decoded.email, jti: newJti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    // 5. Simpan token baru, hapus token lama
    await redisClient.multi()
      .del(`refresh_${oldJti}`)
      .set(`refresh_${newJti}`, newRefreshToken, { EX: 7 * 24 * 60 * 60 })
      .exec()

    // 6. Audit log
    logger.auth(`Refresh token berhasil: User ${decoded.email} (ID: ${decoded.id}), JTI: ${oldJti} → ${newJti}`)

    return res.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken
    })

  } catch (err) {
    err.source = 'refreshToken'
    logger.security(`Refresh token GAGAL diverifikasi: ${err.message}`)
    return res.status(401).json({ message: 'Refresh token tidak valid atau kadaluwarsa' })
  }
}

module.exports = { register, login, logout, refreshToken }
