# 🚀 Railway Deployment Guide - TaniPintar Backend

## 📋 Prerequisites
- GitHub repository: https://github.com/tanziljws/tanipintar_server.git
- Railway account (railway.app)
- PostgreSQL database credentials

## 🔧 Deployment Steps

### 1. Create New Project di Railway
1. Login ke [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose repository: `tanziljws/tanipintar_server`
5. Click **"Deploy Now"**

### 2. Setup PostgreSQL Database
1. Di Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for database to be created
4. Copy database credentials dari **"Connect"** tab

### 3. Configure Environment Variables
Di Railway project → **Variables** tab, add:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (dari PostgreSQL service)
DB_HOST=<dari Railway PostgreSQL>
DB_PORT=<dari Railway PostgreSQL>
DB_USER=<dari Railway PostgreSQL>
DB_PASSWORD=<dari Railway PostgreSQL>
DB_NAME=<dari Railway PostgreSQL>
DB_USE_SSL=true

# JWT Configuration
JWT_SECRET=super-secret-jwt-key-production-tanipintar-2024
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=refresh-secret-key-tanipintar-2024
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# MQTT Configuration
MQTT_BROKER_HOST=52.221.185.96
MQTT_BROKER_PORT=1883
MQTT_USERNAME=root
MQTT_PASSWORD=123

# API Keys
WEATHER_API_KEY=your_weather_api_key
CHATBOT_API_KEY=your_chatbot_api_key

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Schema Setup
Setelah deployment berhasil, koneksi ke database dan run SQL schema:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gardens table
CREATE TABLE IF NOT EXISTS gardens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    size DECIMAL(10,2),
    crop_type VARCHAR(100),
    planting_date DATE,
    estimated_harvest DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensors table
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    garden_id INTEGER REFERENCES gardens(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2),
    unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_gardens_user_id ON gardens(user_id);
CREATE INDEX IF NOT EXISTS idx_sensors_garden_id ON sensors(garden_id);
CREATE INDEX IF NOT EXISTS idx_sensors_timestamp ON sensors(timestamp);
```

### 5. Verify Deployment
1. Check deployment logs di Railway dashboard
2. Test health endpoint: `https://your-app.railway.app/health`
3. Test API endpoints: `https://your-app.railway.app/debug/routes`

## 🔗 API Endpoints
Base URL: `https://your-railway-app.railway.app`

- **Health Check**: `GET /health`
- **Authentication**: `POST /v1/auth/login`, `POST /v1/auth/register`
- **Garden Management**: `GET /v1/garden`, `POST /v1/garden`
- **Profile**: `GET /v1/profile`, `PUT /v1/profile`
- **Chatbot**: `POST /v1/chatbot/chat`
- **Weather**: `GET /v1/weather`

## 🛠️ Troubleshooting

### Common Issues:
1. **Database Connection Error**: Check DB credentials in Variables
2. **Build Failed**: Check dependencies in package.json
3. **Port Issues**: Railway automatically assigns PORT variable
4. **SSL Certificate**: Railway provides HTTPS automatically

### Logs Commands:
```bash
# View deployment logs
railway logs

# View application logs
railway logs --tail
```

## 📱 Update Flutter App
Setelah backend deployed, update file `.env` di Flutter app:

```env
API_BASE_URL=https://your-railway-app.railway.app
```

## 🚀 Ready for Production!
Backend TaniPintar siap digunakan dengan:
- ✅ PostgreSQL Database
- ✅ MQTT Configuration (52.221.185.96)
- ✅ JWT Authentication
- ✅ Rate Limiting & Security
- ✅ Health Monitoring
- ✅ Auto SSL/HTTPS
