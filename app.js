require('dotenv').config()

const express = require('express')

const authRoutes = require('./src/routes/authRoute')
const errorHandler = require('./src/middlewares/errorHandler')

const app = express()

app.use(express.json())

app.use('/api/auth', authRoutes)

app.use(errorHandler)

module.exports = app
