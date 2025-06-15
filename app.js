const cookieParser = require('cookie-parser')
const express = require('express')
const helmet = require('helmet')

const authRoutes = require('./src/routes/authRoute')
const errorHandler = require('./src/middlewares/errorHandler')

// const chatRoutes = require('./routes/chatRoute')
const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(helmet())

app.use('/api/auth', authRoutes)
// app.use('/api/chat', chatRoutes)

app.use(errorHandler)

module.exports = app
