const { Pool } = require('pg')
require('dotenv').config()

const isProduction = process.env.NODE_ENV === 'production'

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
})

pool.connect()
  .then(client => {
    console.log('Database connected successfully')
    client.release()
  })
  .catch(err => {
    console.error('Database connection failed:', err.message)
  })

pool.on('error', err => {
  console.error('Database connection error:', err.message)
})

module.exports = pool
