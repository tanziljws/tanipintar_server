const { createLogger, format, transports } = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const moment = require('moment-timezone')
const path = require('path')

const isDevelopment = process.env.NODE_ENV === 'development'

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: () => moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
    }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../../logs/app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    ...(isDevelopment ? [new transports.Console()] : [])
  ]
})

logger.auth = (message) => logger.info(`[AUTH] ${message}`)
logger.audit = (message) => logger.info(`[AUDIT] ${message}`)
logger.security = (message) => logger.warn(`[SECURITY] ${message}`)

module.exports = logger
