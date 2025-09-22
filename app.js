require("dotenv").config()

const {
    globalRateLimiter,
    loginRateLimiter,
    refreshRateLimiter,
    registerRateLimiter,
} = require("./src/middlewares/rateLimiter")

const express = require("express")
const cors = require("cors")

const errorHandler = require("./src/middlewares/errorHandler")
const logger = require("./src/utils/logger")
const secureHeaders = require("./src/middlewares/secureHeaders")
const v1Routes = require("./src/api/v1")

const app = express()

app.set("trust proxy", 1)
app.use(express.json())

app.use(cors({
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(secureHeaders)
app.use(globalRateLimiter)

// Middleware perlindungan User-Agent
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        const userAgent = req.get('User-Agent') || ''
        const ip = req.ip

        // Jika kosong
        if (!userAgent.trim()) {
            logger.security(`User-Agent kosong diblokir, IP: ${ip}`)
            return res.status(403).json({ message: 'Permintaan tanpa User-Agent tidak diizinkan.' })
        }

        // Jika terlalu panjang (>200 karakter misalnya)
        if (userAgent.length > 200) {
            logger.security(`User-Agent terlalu panjang diblokir (${userAgent.length} chars), IP: ${ip}`)
            return res.status(403).json({ message: 'User-Agent tidak valid.' })
        }

        // Jika termasuk daftar blokir
        const blockedAgents = ['curl', 'python', 'httpclient', 'wget']
        const isBlocked = blockedAgents.some(agent =>
            userAgent.toLowerCase().includes(agent)
        )

        if (isBlocked) {
            logger.security(`User-Agent diblokir: ${userAgent}, IP: ${ip}`)
            return res.status(403).json({ message: 'Permintaan dari agen ini tidak diizinkan.' })
        }
        logger.api(`User-Agent diterima: ${userAgent}, IP: ${ip}`)
        next()
    })
}

// Logger untuk semua request
app.use((req, res, next) => {
    logger.api(`[${req.method}] ${req.originalUrl} - ${req.ip} - ${req.get('User-Agent')}`)
    next()
})

app.use("/v1", v1Routes)

app.get("/health", (req, res) => {
    res.json({
        status: "success",
        message: "TaniPintar Backend is running!",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    })
})

// Debug endpoint to check routes
app.get("/debug/routes", (req, res) => {
    res.json({
        status: "success",
        message: "Available routes",
        routes: [
            "/v1/auth/login",
            "/v1/auth/register", 
            "/v1/garden",
            "/v1/profile",
            "/v1/chatbot",
            "/v1/weather"
        ]
    })
})

app.use(errorHandler)

module.exports = app
