require('dotenv').config()

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const logger = require('../utils/logger')

const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
requiredEnv.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

const useSSL = process.env.DB_USE_SSL === 'true'
let sslConfig = false

if (useSSL) {
  // Check if we have a custom SSL certificate file
  const certPath = path.join(__dirname, '../../certs/global-bundle.pem')
  
  if (fs.existsSync(certPath)) {
    // Use custom certificate file (for AWS RDS, etc.)
    sslConfig = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(certPath).toString()
    }
    logger.info('DATABASE SSL: Using custom certificate file')
  } else {
    // Use Railway/Heroku style SSL (no certificate file needed)
    sslConfig = {
      rejectUnauthorized: false
    }
    logger.info('DATABASE SSL: Using Railway/Heroku style SSL')
  }
} else {
  logger.info('DATABASE SSL: Disabled')
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig
})

const connectToDatabase = async () => {
  try {
    const client = await pool.connect()
    logger.info('Database connected successfully')
    client.release()
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`)
    process.exit(1)
  }
}

pool.on('error', err => {
  logger.error(`Database connection error: ${err.message}`)
})

module.exports = { pool, connectToDatabase }
