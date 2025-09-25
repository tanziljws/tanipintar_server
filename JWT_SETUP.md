# 🔐 JWT Security Setup - TaniPintar Backend

## 🎯 **Overview**
Sistem JWT yang telah di-setup dengan security best practices untuk production environment.

## 🔑 **Generated JWT Secrets (Production Ready)**

### Secure Secrets (64-byte random hex):
```env
JWT_SECRET=c88cfd29c1ff8e5c6afe49344522ba2115f26caa2293a3dc3ffb85f0bd3a66af27e35dc3226cbff9fc5d48ce3cd447d8208c0e3910957042e85c98d744d8fcc2

JWT_REFRESH_SECRET=12585cbe00e1ff55d5df542f2436096dc8b001630d8561d8c7342ba4b4ea611ea7d64c645b18faecabb46253c5b2c2ba77df5873b2385aae7ee41f121a6f407f
```

## ⚙️ **JWT Configuration**

### Environment Variables:
```env
# JWT Configuration - SECURE PRODUCTION SECRETS
JWT_SECRET=c88cfd29c1ff8e5c6afe49344522ba2115f26caa2293a3dc3ffb85f0bd3a66af27e35dc3226cbff9fc5d48ce3cd447d8208c0e3910957042e85c98d744d8fcc2
JWT_REFRESH_SECRET=12585cbe00e1ff55d5df542f2436096dc8b001630d8561d8c7342ba4b4ea611ea7d64c645b18faecabb46253c5b2c2ba77df5873b2385aae7ee41f121a6f407f
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=tanipintar-backend
JWT_AUDIENCE=tanipintar-mobile
```

## 🏗️ **Architecture & Features**

### 1. **JWT Config Module** (`src/config/jwt.js`)
- ✅ Centralized JWT configuration
- ✅ Secure token generation & verification
- ✅ Input validation & error handling
- ✅ Automatic expiry calculation
- ✅ Token type validation (access vs refresh)
- ✅ Comprehensive logging

### 2. **Security Features**
- ✅ **Strong Secrets**: 64-byte cryptographically secure random keys
- ✅ **Short Access Token Expiry**: 1 hour (configurable)
- ✅ **Refresh Token Rotation**: New tokens on each refresh
- ✅ **Token Blacklisting**: Invalid tokens tracked in Redis
- ✅ **Issuer/Audience Validation**: Prevents token misuse
- ✅ **Error Code Classification**: Specific error types for frontend handling

### 3. **Token Structure**
#### Access Token Payload:
```json
{
  "userId": 123,
  "email": "user@example.com", 
  "name": "User Name",
  "type": "access",
  "iss": "tanipintar-backend",
  "aud": "tanipintar-mobile",
  "sub": "123",
  "exp": 1640000000,
  "iat": 1639996400
}
```

#### Refresh Token Payload:
```json
{
  "userId": 123,
  "email": "user@example.com",
  "type": "refresh",
  "iss": "tanipintar-backend", 
  "aud": "tanipintar-mobile",
  "sub": "123",
  "exp": 1640604400,
  "iat": 1639996400
}
```

## 🔐 **Authentication Flow**

### 1. **Login Process**
```
User Credentials → Password Validation → Generate Token Pair → Store Refresh Token in Redis → Return Tokens
```

### 2. **Token Refresh Process**
```
Refresh Token → Verify & Validate → Blacklist Old Token → Generate New Pair → Update Redis → Return New Tokens
```

### 3. **Logout Process**
```
Access Token → Verify → Blacklist Token → Remove from Redis → Success Response
```

## 🛡️ **Security Measures**

### 1. **Token Validation**
- Signature verification with secure secrets
- Expiry time validation
- Issuer/Audience validation
- Token type validation (access vs refresh)
- Blacklist checking

### 2. **Attack Prevention**
- **Replay Attacks**: Token rotation on refresh
- **JWT Theft**: Short access token expiry
- **Brute Force**: Rate limiting on auth endpoints
- **Token Reuse**: Refresh token blacklisting
- **CSRF**: SameSite cookie policies (if using cookies)

### 3. **Audit & Monitoring**
- Comprehensive logging for all JWT operations
- Failed authentication attempt tracking
- Security event logging with IP addresses
- Email masking in logs for privacy

## 📱 **Frontend Integration**

### Token Storage (Flutter):
```dart
// Store tokens securely
await FlutterSecureStorage().write(key: 'access_token', value: accessToken);
await FlutterSecureStorage().write(key: 'refresh_token', value: refreshToken);

// API Request with token
dio.options.headers['Authorization'] = 'Bearer $accessToken';
```

### Auto-Refresh Logic:
```dart
// Intercept 401 responses and refresh token
dio.interceptors.add(InterceptorsWrapper(
  onError: (error, handler) async {
    if (error.response?.statusCode == 401) {
      // Refresh token logic
      final newTokens = await refreshToken();
      // Retry original request
    }
  },
));
```

## 🚀 **Railway Deployment Variables**

Copy these exact variables to Railway:
```env
JWT_SECRET=c88cfd29c1ff8e5c6afe49344522ba2115f26caa2293a3dc3ffb85f0bd3a66af27e35dc3226cbff9fc5d48ce3cd447d8208c0e3910957042e85c98d744d8fcc2
JWT_REFRESH_SECRET=12585cbe00e1ff55d5df542f2436096dc8b001630d8561d8c7342ba4b4ea611ea7d64c645b18faecabb46253c5b2c2ba77df5873b2385aae7ee41f121a6f407f
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=tanipintar-backend
JWT_AUDIENCE=tanipintar-mobile
```

## ✅ **Testing JWT Setup**

### 1. **Login Test**
```bash
curl -X POST https://your-app.railway.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. **Protected Route Test**
```bash
curl -X GET https://your-app.railway.app/v1/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. **Token Refresh Test**
```bash
curl -X POST https://your-app.railway.app/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

## 🎉 **Production Ready!**

✅ **Secure 64-byte random secrets**  
✅ **Token rotation & blacklisting**  
✅ **Comprehensive error handling**  
✅ **Security logging & monitoring**  
✅ **Railway deployment ready**  
✅ **Frontend integration guide**  

**JWT system siap untuk production dengan security best practices!** 🚀
