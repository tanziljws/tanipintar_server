require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_USE_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function setupDatabase() {
  console.log('🔄 Setting up TaniPintar database...')
  
  try {
    // Test connection
    const client = await pool.connect()
    console.log('✅ Database connection successful')
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute schema
    console.log('🔄 Creating tables...')
    await client.query(schema)
    console.log('✅ Database schema created successfully')
    
    // Test data
    const result = await client.query('SELECT COUNT(*) FROM users')
    console.log(`✅ Database setup complete. Users count: ${result.rows[0].count}`)
    
    client.release()
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

setupDatabase()
