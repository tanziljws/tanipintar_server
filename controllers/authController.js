const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/hash');

const register = async (req, res) => {
  const { email, full_name, ktp_number, birthplace, birthdate, password } = req.body;

  try {
    // Cek jika email sudah ada
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Simpan ke DB
    await pool.query(`
      INSERT INTO users (email, full_name, ktp_number, birthplace, birthdate, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [email, full_name, ktp_number, birthplace, birthdate, password_hash]);

    res.status(201).json({ message: 'Registrasi berhasil' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Email tidak ditemukan' });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password salah' });
    }

    // Buat JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };
