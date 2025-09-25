# 🔧 Railway SSL Certificate Fix

## ❌ **Error Yang Terjadi:**
```
Error: ENOENT: no such file or directory, open '/app/certs/global-bundle.pem'
```

## ✅ **Solusi:**

### 1. **Database SSL Configuration Fix**
File `src/config/db.js` sudah diupdate untuk:
- ✅ **Deteksi otomatis** SSL certificate file
- ✅ **Railway/Heroku compatibility** tanpa certificate file
- ✅ **Flexible SSL configuration** untuk berbagai platform

### 2. **Environment Variables untuk Railway**

Di **Railway Variables**, set:

```env
# Database Configuration (dari PostgreSQL service credentials)
DB_HOST=<PGHOST dari Railway PostgreSQL>
DB_PORT=<PGPORT dari Railway PostgreSQL>
DB_USER=<PGUSER dari Railway PostgreSQL>
DB_PASSWORD=<PGPASSWORD dari Railway PostgreSQL>
DB_NAME=<PGDATABASE dari Railway PostgreSQL>
DB_USE_SSL=true

# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration
JWT_SECRET=c88cfd29c1ff8e5c6afe49344522ba2115f26caa2293a3dc3ffb85f0bd3a66af27e35dc3226cbff9fc5d48ce3cd447d8208c0e3910957042e85c98d744d8fcc2
JWT_REFRESH_SECRET=12585cbe00e1ff55d5df542f2436096dc8b001630d8561d8c7342ba4b4ea611ea7d64c645b18faecabb46253c5b2c2ba77df5873b2385aae7ee41f121a6f407f
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=tanipintar-backend
JWT_AUDIENCE=tanipintar-mobile

# MQTT Configuration
MQTT_BROKER_HOST=52.221.185.96
MQTT_BROKER_PORT=1883
MQTT_USERNAME=root
MQTT_PASSWORD=123

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ **SSL Configuration Logic**

### Auto-Detection:
1. **Jika `DB_USE_SSL=true` DAN file certificate ada** → Use custom certificate
2. **Jika `DB_USE_SSL=true` DAN file certificate TIDAK ada** → Use Railway/Heroku SSL
3. **Jika `DB_USE_SSL=false`** → No SSL

### Railway PostgreSQL:
- ✅ **Gunakan `DB_USE_SSL=true`**
- ✅ **Tidak perlu certificate file**
- ✅ **Otomatis detect Railway environment**

## 🚀 **Deployment Steps**

### 1. Get Railway PostgreSQL Credentials
1. **Railway Dashboard** → **PostgreSQL service** → **Variables tab**
2. **Copy semua credentials**:
   - `PGHOST` → `DB_HOST`
   - `PGPORT` → `DB_PORT`
   - `PGUSER` → `DB_USER`
   - `PGPASSWORD` → `DB_PASSWORD`
   - `PGDATABASE` → `DB_NAME`

### 2. Set Backend Environment Variables
1. **Backend service** → **Variables tab**
2. **Add all variables** dari list di atas

### 3. Redeploy
1. **Otomatis redeploy** setelah set variables
2. **Check deployment logs** untuk success

### 4. Setup Database Schema
Setelah deployment berhasil:
```bash
# Di Railway dashboard atau menggunakan database client
# Run SQL dari file database/schema.sql
```

## ✅ **Expected Result**

Deployment logs akan show:
```
DATABASE SSL: Using Railway/Heroku style SSL
Database connected successfully
TaniPintar Backend is running!
Server is running on port 3000
```

## 🔍 **Troubleshooting**

### Jika masih error:
1. **Check semua environment variables** sudah diset
2. **Verify PostgreSQL service** running di Railway
3. **Check database credentials** match dengan PostgreSQL service
4. **Try set `DB_USE_SSL=false`** untuk debug (temporary)

### Common Issues:
- **Wrong database credentials** → Check PostgreSQL Variables tab
- **SSL connection issues** → Set `DB_USE_SSL=true` untuk Railway
- **Port/Host issues** → Use exact values dari Railway PostgreSQL
- **Network issues** → Railway PostgreSQL harus di project yang sama

## 🎯 **Quick Fix Summary**

1. ✅ **SSL config fixed** di `src/config/db.js`
2. ✅ **Set `DB_USE_SSL=true`** di Railway Variables
3. ✅ **Copy PostgreSQL credentials** dari Railway
4. ✅ **Redeploy** backend service
5. ✅ **Run database schema** setelah deploy berhasil
