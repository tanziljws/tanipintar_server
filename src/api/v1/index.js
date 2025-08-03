const express = require("express")
const router = express.Router()

const authRoutes = require('./auth/authRoute')
const profileRoutes = require('./profile/profileRoute')
const gardenRoutes = require('./garden/gardenRoute')
const chatbotRoutes = require("./chatbot/routes/chatbotRoute")
const weatherRoutes = require("./chatbot/routes/weatherRoute")

router.use("/auth", authRoutes)
router.use("/profile", profileRoutes)
router.use("/garden", gardenRoutes)

// Routes without rate limiting
router.use("/chatbot", chatbotRoutes)
router.use("/weather", weatherRoutes)

module.exports = router
