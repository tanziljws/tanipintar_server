require("dotenv").config()

const express = require("express")

const authRoutes = require("./src/routes/authRoute")
const profileRoutes = require("./src/routes/profileRoute")
const gardenRoutes = require("./src/routes/gardenRoute")
const chatbotRoutes = require("./src/routes/chatbotRoute")
const weatherRoutes = require("./src/routes/weatherRoute")
const errorHandler = require("./src/middlewares/errorHandler")

const app = express()

app.use(express.json())

// Existing routes
app.use("/api/auth", authRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/garden", gardenRoutes)

// Routes without rate limiting
app.use("/api/chatbot", chatbotRoutes)
app.use("/api/weather", weatherRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "success",
        message: "TaniPintar Backend is running!",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    })
})

app.use(errorHandler)

module.exports = app
