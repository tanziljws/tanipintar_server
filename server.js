const app = require('./app')
const pool = require('./src/config/db')

const PORT = process.env.PORT || 4000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// ⬇️ Simpan ke variabel server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

const shutdown = () => {
  console.log('\nShutting down gracefully...')
  server.close(() => {
    console.log('HTTP server closed')

    pool.end()
      .then(() => {
        console.log('Database pool has ended')
        process.exit(0)
      })
      .catch((err) => {
        console.error('Error closing DB pool:', err)
        process.exit(1)
      })
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
