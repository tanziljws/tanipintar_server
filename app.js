require('dotenv').config()

const express = require('express')

const authRoutes = require('./src/routes/authRoute')
const mqttRoutes = require('./src/routes/sensorRoute')
const profileRoutes = require('./src/routes/profileRoute')
const errorHandler = require('./src/middlewares/errorHandler')

const app = express()

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/sensors', mqttRoutes)

app.use(errorHandler)

module.exports = app
