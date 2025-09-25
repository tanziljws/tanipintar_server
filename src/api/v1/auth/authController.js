const { v4: uuidv4 } = require('uuid')
const { parse, format } = require('date-fns')

const jwtConfig = require('../../../config/jwt')
const { addToBlacklist } = require('../../../utils/redis/tokenBlacklist')
const { hashPassword, comparePassword } = require('../../../utils/hash')
const { pool } = require('../../../config/db')
const { redisClient } = require('../../../utils/redis/redisClient')
const logger = require('../../../utils/logger')

// Mask email for logging
const maskEmail = (email) => {
  const [name, domain] = email.split("@")
  return `${name[0]}***${name.slice(-1)}@${domain}`
}

// REGISTER
const register = async (req, res, next) => {
  const { email, full_name, ktp_number, birthplace, birthdate, password } = req.body
  const ip = req.ip

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      logger.security(`Registrasi gagal: Email sudah terdaftar (${maskEmail(email)}), IP: ${ip}`)
      return res.status(409).json({ message: 'Email sudah terdaftar' })
    }

    const existingKTP = await pool.query('SELECT id FROM users WHERE ktp_number = $1', [ktp_number])
    if (existingKTP.rows.length > 0) {
      logger.security(`Registrasi gagal: Nomor KTP sudah terdaftar, IP: ${ip}`)
      return res.status(409).json({ message: 'Nomor KTP sudah terdaftar' })
    }

    const parsedBirthdate = parse(birthdate, 'dd-MM-yyyy', new Date())
    const formattedBirthdate = format(parsedBirthdate, 'yyyy-MM-dd')

    const password_hash = await hashPassword(password)

    await pool.query(`
      INSERT INTO users (email, full_name, ktp_number, birthplace, birthdate, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [email, full_name, ktp_number, birthplace, formattedBirthdate, password_hash])

    logger.auth(`Registrasi berhasil: ${maskEmail(email)}, IP: ${ip}`)
    return res.status(201).json({ message: 'Registrasi berhasil' })
  } catch (err) {
    err.source = 'register'
    next(err)
  }
}

// LOGIN
const login = async (req, res, next) => {
  const { email, password } = req.body
  const ip = req.ip

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      logger.security(`Login gagal: Email tidak ditemukan (${maskEmail(email)}), IP: ${ip}`)
      return res.status(404).json({ message: 'Email tidak ditemukan' })
    }

    const user = result.rows[0]
    const isMatch = await comparePassword(password, user.password_hash)
    if (!isMatch) {
      logger.security(`Login gagal: Password salah (${maskEmail(email)}), IP: ${ip}`)
      return res.status(401).json({ message: 'Password salah' })
    }

    // Generate secure token pair using JWT config
    const tokenPair = jwtConfig.generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.full_name
    })

    // Store refresh token in Redis for rotation security
    const jti = uuidv4()
    await redisClient.set(`refresh_${jti}`, tokenPair.refreshToken, { 
      EX: 7 * 24 * 60 * 60 // 7 days
    })

    logger.auth(`Login berhasil: ${maskEmail(email)}, IP: ${ip}`)
    return res.json({
      message: 'Login berhasil',
      ...tokenPair,
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
  const ip = req.ip

  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(400).json({ message: 'Token tidak ditemukan' })
    }

    let decoded
    try {
      decoded = jwtConfig.verifyAccessToken(token)
    } catch (error) {
      logger.security(`Logout gagal: token tidak valid atau kadaluwarsa (${error.message}), IP: ${ip}`)
      return res.status(401).json({ message: 'Token tidak valid atau kadaluwarsa' })
    }

    const jti = decoded.jti
    const exp = decoded.exp * 1000

    // Opsional: pengecekan manual expiry
    if (Date.now() > exp) {
      logger.security(`Logout: token sudah kadaluwarsa (JTI: ${jti}), IP: ${ip}`)
      return res.status(400).json({ message: 'Token sudah kedaluwarsa' })
    }

    // Tambahkan ke blacklist dan hapus refresh token dari Redis
    await addToBlacklist(jti, exp)
    await redisClient.del(`refresh_${jti}`)

    logger.auth(`Logout: ${maskEmail(decoded.email)} (JTI: ${jti}), IP: ${ip}`)

    return res.json({ message: 'Logout berhasil' })
  } catch (err) {
    err.source = 'logout'
    next(err)
  }
}

// REFRESH TOKEN
const refreshToken = async (req, res, next) => {
  const { refresh_token } = req.body
  const ip = req.ip

  if (!refresh_token) {
    return res.status(401).json({ message: 'Refresh token tidak ditemukan' })
  }

  try {
    const decoded = jwtConfig.verifyRefreshToken(refresh_token)
    const oldJti = decoded.jti || uuidv4() // fallback if no jti

    // 1. Pastikan token ada di Redis (rotating logic utama)
    const storedToken = await redisClient.get(`refresh_${oldJti}`)
    if (!storedToken) {
      logger.security(`Refresh token tidak berlaku atau sudah digunakan (JTI: ${oldJti}, email: ${maskEmail(decoded.email)}), IP: ${ip}`)
      return res.status(403).json({ message: 'Refresh token sudah tidak berlaku (sudah digunakan atau kedaluwarsa)' })
    }

    // 2. Cegah replay attack
    if (storedToken !== refresh_token) {
      // Jika token sama jti-nya tapi value beda → reuse!
      logger.security(`Refresh token reuse terdeteksi (JTI ${oldJti}, email: ${maskEmail(decoded.email)}), IP: ${ip}`)
      return res.status(403).json({ message: 'Refresh token tidak valid (kemungkinan reuse)' })
    }

    // 3. Blacklist token lama
    await addToBlacklist(oldJti, decoded.exp * 1000)

    // 4. Generate token pair baru dengan JWT config
    const newTokenPair = jwtConfig.generateTokenPair({
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'User'
    })

    const newJti = uuidv4()

    // 5. Simpan token baru, hapus token lama
    await redisClient.multi()
      .del(`refresh_${oldJti}`)
      .set(`refresh_${newJti}`, newTokenPair.refreshToken, { EX: 7 * 24 * 60 * 60 })
      .exec()

    // 6. Audit log
    logger.auth(`Refresh token berhasil: User ${maskEmail(decoded.email)} (UID: ${decoded.userId}), JTI: ${oldJti} → ${newJti}, IP: ${ip}`)

    return res.json({
      message: 'Token refresh berhasil',
      ...newTokenPair
    })

  } catch (error) {
    logger.security(`Refresh token GAGAL diverifikasi: ${error.message}, IP: ${ip}`)
    return res.status(401).json({ message: 'Refresh token tidak valid atau kadaluwarsa' })
  }
}

module.exports = { register, login, logout, refreshToken }
