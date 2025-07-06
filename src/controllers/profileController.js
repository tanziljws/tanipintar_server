const moment = require('moment')

const { hashPassword, comparePassword } = require('../utils/hash')
const { pool } = require('../config/db')
const logger = require('../utils/logger')

// GET PROFILE
const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT email, full_name, ktp_number, birthplace, birthdate FROM users WHERE id = $1', [req.user.id])
    const user = result.rows[0]

    const formattedBirthdate = moment(user.birthdate).format('DD-MM-YYYY')

    res.json({
      user: {
        email: user.email,
        full_name: user.full_name,
        ktp_number: user.ktp_number,
        birthplace: user.birthplace,
        birthdate: formattedBirthdate
      }
    })
  } catch (err) {
    err.source = 'getProfile'
    next(err)
  }
}

// UPDATE PROFILE
const updateProfile = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'Email sudah digunakan oleh user lain' });
      }

      await pool.query(
        'UPDATE users SET email = $1 WHERE id = $2',
        [email, req.user.id]
      );

      logger.auth(`Update email: ${req.user.email} -> ${email}`);
      updateMessage = 'Email berhasil diperbarui';
    }

    if (password) {
      if (!current_password) {
        logger.security(`Update password gagal: Password lama tidak disediakan (${req.user.email})`)
        return res.status(400).json({
          message: "Password lama wajib diisi untuk mengubah password",
        })
      }

      // Ambil password hash dari database
      const userResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id])

      if (userResult.rows.length === 0) {
        logger.security(`Update password gagal: User tidak ditemukan (ID: ${req.user.id})`)
        return res.status(404).json({ message: "User tidak ditemukan" })
      }

      const currentPasswordHash = userResult.rows[0].password_hash

      // Verifikasi password lama
      const isCurrentPasswordValid = await comparePassword(current_password, currentPasswordHash)

      if (!isCurrentPasswordValid) {
        logger.security(`Update password gagal: Password lama salah (${req.user.email})`)
        return res.status(401).json({
          message: "Password lama yang Anda masukkan salah",
        })
      }

      // Cek apakah password baru sama dengan password lama
      const isSamePassword = await comparePassword(password, currentPasswordHash)
      if (isSamePassword) {
        return res.status(400).json({
          message: "Password baru tidak boleh sama dengan password lama",
        })
      }

      // Hash password baru dan update
      const newPasswordHash = await hashPassword(password)

      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newPasswordHash, req.user.id])

      logger.auth(`Update password berhasil: ${req.user.email}`)
      updateMessage = email ? "Email dan password berhasil diperbarui" : "Password berhasil diperbarui"
    }

    return res.status(200).json({
      message: updateMessage || 'Profil berhasil diperbarui',
      success: true
    });
  } catch (err) {
    err.source = 'updateProfile'
    next(err)
  }
}

module.exports = {getProfile, updateProfile }