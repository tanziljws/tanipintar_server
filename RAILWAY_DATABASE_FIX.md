# 🔧 Railway Database Connection Fix

## ❌ **Error Yang Terjadi:**
```
ERROR: Database connection failed: getaddrinfo ENOTFOUND <PGHOST dari PostgreSQL>
```

## 🎯 **Root Cause:**
Environment variables masih menggunakan **placeholder text** bukan **nilai database yang sesungguhnya**.

## ✅ **Solusi Langkah demi Langkah:**

### Step 1: Dapatkan Credentials PostgreSQL Yang Benar

1. **Buka Railway Dashboard**: https://railway.app/dashboard
2. **Pilih Project** TaniPintar
3. **Click PostgreSQL service** (bukan backend service)
4. **Go to "Variables" tab**
5. **Copy nilai ASLI** (bukan placeholder):

```
PGHOST=monorail.proxy.rlwy.net
PGPORT=12345
PGUSER=postgres  
PGPASSWORD=ABcd1234567890XYZ
PGDATABASE=railway
```

**CONTOH NILAI ASLI** (bukan placeholder):
- ❌ **SALAH**: `<PGHOST dari PostgreSQL>` 
- ✅ **BENAR**: `monorail.proxy.rlwy.net`

### Step 2: Set Environment Variables di Backend Service

1. **Click Backend Service** (`tanipintar_server`)
2. **Go to "Variables" tab**  
3. **Add/Update variables** dengan **NILAI ASLI**:

```env
# Database Configuration - GUNAKAN NILAI ASLI DARI STEP 1
DB_HOST=monorail.proxy.rlwy.net
DB_PORT=12345
DB_USER=postgres
DB_PASSWORD=ABcd1234567890XYZ
DB_NAME=railway
DB_USE_SSL=true

# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration (sudah benar)
JWT_SECRET=c88cfd29c1ff8e5c6afe49344522ba2115f26caa2293a3dc3ffb85f0bd3a66af27e35dc3226cbff9fc5d48ce3cd447d8208c0e3910957042e85c98d744d8fcc2
JWT_REFRESH_SECRET=12585cbe00e1ff55d5df542f2436096dc8b001630d8561d8c7342ba4b4ea611ea7d64c645b18faecabb46253c5b2c2ba77df5873b2385aae7ee41f121a6f407f
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=tanipintar-backend
JWT_AUDIENCE=tanipintar-mobile

# MQTT Configuration (sudah benar)
MQTT_BROKER_HOST=52.221.185.96
MQTT_BROKER_PORT=1883
MQTT_USERNAME=root
MQTT_PASSWORD=123

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Verify Environment Variables

**Double-check di Backend Variables tab:**
- ✅ `DB_HOST` = nilai host Railway (misal: `monorail.proxy.rlwy.net`)
- ✅ `DB_PORT` = nilai port Railway (misal: `12345`)
- ✅ `DB_USER` = biasanya `postgres`
- ✅ `DB_PASSWORD` = password Railway yang panjang
- ✅ `DB_NAME` = nama database Railway (biasanya `railway`)

### Step 4: Redeploy & Test

1. **Setelah set variables** → Railway akan auto-redeploy
2. **Check deployment logs** untuk success:

**Expected Success Logs:**
```
[INFO] DATABASE SSL: Using Railway/Heroku style SSL
[INFO] JWT configuration validated successfully  
[INFO] Database connected successfully
[INFO] TaniPintar Backend is running!
Server is running on port 3000
```

### Step 5: Setup Database Schema

Setelah connection berhasil:

1. **Connect ke PostgreSQL** menggunakan Railway CLI atau database client
2. **Run SQL schema**:

```bash
# Option 1: Railway CLI
railway connect postgresql
# Then paste SQL dari database/schema.sql

# Option 2: Database client (pgAdmin, DBeaver, etc.)
# Connect dengan credentials yang sama
# Run SQL dari database/schema.sql
```

## 🔍 **Troubleshooting:**

### Jika masih `ENOTFOUND` error:

1. **Check PostgreSQL service status**:
   - Railway Dashboard → PostgreSQL → Status harus "Running"

2. **Verify credentials exact match**:
   - Copy-paste langsung dari PostgreSQL Variables
   - No extra spaces atau karakter

3. **Check network connectivity**:
   - Backend dan PostgreSQL harus di **project yang sama**

4. **Test connection manual**:
   ```bash
   # Test dengan psql command
   psql -h monorail.proxy.rlwy.net -p 12345 -U postgres -d railway
   ```

### Common Mistakes:

- ❌ **Menggunakan placeholder text** seperti `<PGHOST dari PostgreSQL>`
- ❌ **Copy dari dokumentasi** bukan dari Variables tab
- ❌ **Typo** dalam nama variable (DB_HOST vs PGHOST)
- ❌ **PostgreSQL service belum dibuat** atau not running
- ❌ **Backend service di project berbeda** dari PostgreSQL

## 📋 **Checklist Sebelum Deploy:**

- [ ] PostgreSQL service created & running
- [ ] Credentials copied dari PostgreSQL Variables tab (nilai asli)
- [ ] Backend Variables set dengan credentials yang benar
- [ ] `DB_USE_SSL=true` 
- [ ] No placeholder text dalam environment variables
- [ ] Both services dalam project yang sama

## ✅ **Expected Result:**

Setelah fix, deployment akan berhasil dan endpoint `/health` akan return:

```json
{
  "status": "success",
  "message": "TaniPintar Backend is running!",
  "timestamp": "2025-09-25T08:45:00.000Z",
  "environment": "production"
}
```

## 🎯 **Quick Fix Summary:**

1. ✅ **Get REAL PostgreSQL credentials** dari Railway Variables
2. ✅ **Set exact values** di Backend Variables (no placeholders)
3. ✅ **Redeploy** otomatis terjadi
4. ✅ **Check logs** untuk "Database connected successfully"
5. ✅ **Run database schema** setelah connection berhasil
