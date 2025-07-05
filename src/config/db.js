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
const sslConfig = useSSL
  ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, '../../certs/global-bundle.pem')).toString()
  }
  : false
logger.info(`Database SSL enabled: ${useSSL}`)

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
