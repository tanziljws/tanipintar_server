# 🔧 Railway Deployment Fix - Environment Variables

## ❌ Error yang Terjadi:
```
Error: Missing required environment variable: DB_HOST
```

## 🚀 Solusi Langkah demi Langkah:

### 1. Setup PostgreSQL Database di Railway

1. **Buka Railway Dashboard**: https://railway.app/dashboard
2. **Pilih Project** yang sudah dibuat
3. **Add Database**:
   - Click **"+ New"** 
   - Pilih **"Database"**
   - Pilih **"PostgreSQL"**
   - Wait hingga database selesai dibuat

### 2. Get Database Credentials

1. **Click PostgreSQL service** di dashboard
2. **Go to "Variables" tab**
3. **Copy credentials** berikut:
   - `PGHOST` → akan jadi `DB_HOST`
   - `PGPORT` → akan jadi `DB_PORT` 
   - `PGUSER` → akan jadi `DB_USER`
   - `PGPASSWORD` → akan jadi `DB_PASSWORD`
   - `PGDATABASE` → akan jadi `DB_NAME`

### 3. Set Environment Variables untuk Backend Service

1. **Click Backend Service** (tanipintar-backend)
2. **Go to "Variables" tab**
3. **Add variables** satu per satu:

```bash
# Database Configuration (dari PostgreSQL service)
DB_HOST=<PGHOST dari PostgreSQL>
DB_PORT=<PGPORT dari PostgreSQL>
DB_USER=<PGUSER dari PostgreSQL>
DB_PASSWORD=<PGPASSWORD dari PostgreSQL>
DB_NAME=<PGDATABASE dari PostgreSQL>
DB_USE_SSL=true

# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration
JWT_SECRET=tanipintar-super-secret-jwt-key-2024-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=tanipintar-refresh-secret-key-2024-production
JWT_REFRESH_EXPIRES_IN=30d

# MQTT Configuration
MQTT_BROKER_HOST=52.221.185.96
MQTT_BROKER_PORT=1883
MQTT_USERNAME=root
MQTT_PASSWORD=123

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional (jika ada)
REDIS_URL=
REDIS_PASSWORD=
WEATHER_API_KEY=
CHATBOT_API_KEY=
```

### 4. Redeploy Service

1. **Setelah set semua variables**
2. **Go to "Deployments" tab**
3. **Click "Redeploy"** atau tunggu auto-redeploy

### 5. Setup Database Schema

1. **Connect to PostgreSQL** menggunakan Railway CLI atau database client
2. **Run SQL schema** dari file `database/schema.sql`:

```bash
# Menggunakan Railway CLI
railway connect postgresql

# Atau copy-paste isi file schema.sql ke database client
```

### 6. Verify Deployment

1. **Check Logs**:
   - Go to "Deployments" tab
   - Click latest deployment
   - Check logs untuk error

2. **Test Health Endpoint**:
   ```
   https://your-app-name.railway.app/health
   ```

3. **Test API Routes**:
   ```
   https://your-app-name.railway.app/debug/routes
   ```

## 🔍 Troubleshooting

### Jika masih error setelah set variables:

1. **Check Variable Names**:
   - Pastikan nama variable exact: `DB_HOST`, `DB_PORT`, dll
   - No extra spaces atau typos

2. **Check Database Connection**:
   - Pastikan PostgreSQL service running
   - Check database credentials di PostgreSQL Variables tab

3. **Redeploy Manual**:
   ```bash
   # Force redeploy
   git commit --allow-empty -m "force redeploy"
   git push
   ```

4. **Check Logs Detail**:
   - Railway Dashboard → Service → Deployments → View Logs
   - Look for connection errors

### Environment Variables Checklist:
- [ ] `DB_HOST` - dari PGHOST PostgreSQL
- [ ] `DB_PORT` - dari PGPORT PostgreSQL  
- [ ] `DB_USER` - dari PGUSER PostgreSQL
- [ ] `DB_PASSWORD` - dari PGPASSWORD PostgreSQL
- [ ] `DB_NAME` - dari PGDATABASE PostgreSQL
- [ ] `DB_USE_SSL=true`
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` - string rahasia untuk JWT
- [ ] `MQTT_BROKER_HOST=52.221.185.96`
- [ ] `MQTT_USERNAME=root`
- [ ] `MQTT_PASSWORD=123`

## ✅ Expected Result

Setelah setup benar, deployment log akan show:
```
Database connected successfully
TaniPintar Backend is running!
Server is running on port 3000
```

Dan health endpoint akan return:
```json
{
  "status": "success",
  "message": "TaniPintar Backend is running!",
  "timestamp": "2024-...",
  "environment": "production"
}
```
