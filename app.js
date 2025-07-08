require('dotenv').config()

const express = require('express')

const authRoutes = require('./src/routes/authRoute')
const profileRoutes = require('./src/routes/profileRoute')
const sensorRoutes = require('./src/routes/sensorRoute')
const gardenRoutes = require('./src/routes/gardenRoute')
const errorHandler = require('./src/middlewares/errorHandler')

const app = express()

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/sensors', sensorRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/garden', gardenRoutes)

app.use(errorHandler)

module.exports = app
