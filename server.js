const fs = require('fs')
const https = require('https')
const path = require('path')
const app = require('./app')
const pool = require('./src/config/db')

const PORT = process.env.PORT || 4000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem')),
}

// ⬇️ Simpan ke variabel server
const server = https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`✅ HTTPS Server running at https://localhost:${PORT}`);
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
