const { pool } = require('../config/db')

const createGarden = async (req, res, next) => {
  try {
    const { name, location, area, area_unit, crop_type } = req.body

    const result = await pool.query(
      `INSERT INTO garden (user_id, name, area, area_unit)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, name, area, area_unit]
    )

    res.status(201).json({
      message: 'Lahan berhasil ditambahkan',
      garden: result.rows[0]
    })
  } catch (err) {
    err.source = 'createGarden';
    next(err);
  }
}

const getUserGarden = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM garden WHERE user_id = $1',
      [req.user.id]
    )

    res.status(200).json({
      garden: result.rows
    })
  } catch (err) {
    err.source = 'getUserGarden';
    next(err);
  }
}

const deleteGarden = async (req, res, next) => {
  try {
    const gardenId = parseInt(req.params.id)

    // Validasi ID
    if (isNaN(gardenId)) {
      return res.status(400).json({ message: 'ID lahan tidak valid' })
    }

    // Pastikan garden milik user yang sedang login
    const check = await pool.query(
      'SELECT * FROM garden WHERE id = $1 AND user_id = $2',
      [gardenId, req.user.id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Lahan tidak ditemukan atau bukan milik Anda' })
    }

    // Lakukan penghapusan
    await pool.query('DELETE FROM garden WHERE id = $1 AND user_id = $2', [
      gardenId,
      req.user.id,
    ])

    res.status(200).json({ message: 'Lahan berhasil dihapus' })
  } catch (err) {
    err.source = 'deleteGarden'
    next(err)
  }
}

const updateGarden = async (req, res, next) => {
  try {
    const gardenId = parseInt(req.params.id);
    const { name, area, area_unit } = req.body;

    // Validasi ID
    if (isNaN(gardenId)) {
      return res.status(400).json({ message: 'ID lahan tidak valid' });
    }

    // Cek apakah lahan tersebut milik user
    const check = await pool.query(
      'SELECT * FROM garden WHERE id = $1 AND user_id = $2',
      [gardenId, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Lahan tidak ditemukan atau bukan milik Anda' });
    }

    // Update lahan
    const result = await pool.query(
      `UPDATE garden
       SET name = $1, area = $2, area_unit = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, area, area_unit, gardenId, req.user.id]
    );

    res.status(200).json({
      message: 'Lahan berhasil diperbarui',
      garden: result.rows[0]
    });
  } catch (err) {
    err.source = 'updateGarden';
    next(err);
  }
};


module.exports = {
  createGarden,
  getUserGarden,
  deleteGarden,
  updateGarden
}
