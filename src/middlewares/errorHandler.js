const errorHandler = (err, req, res, next) => {
    console.error('Global error:', err.message)
    res.status(500).json({ message: 'Terjadi kesalahan pada server' })
}

module.exports = errorHandler
