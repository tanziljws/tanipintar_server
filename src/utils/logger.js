const { createLogger, format, transports } = require("winston")
const { formatInTimeZone } = require("date-fns-tz")
const DailyRotateFile = require("winston-daily-rotate-file")
const path = require("path")

const isDevelopment = process.env.NODE_ENV === "development"

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: () => {
        const now = new Date()
        return formatInTimeZone(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      },
    }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs/app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    ...(isDevelopment ? [new transports.Console()] : []),
  ],
})

logger.api = (message) => logger.info(`[API] ${message}`)

logger.auth = (message) => logger.info(`[AUTH] ${message}`)
logger.audit = (message) => logger.info(`[AUDIT] ${message}`)
logger.security = (message) => logger.warn(`[SECURITY] ${message}`)

logger.chatbot = (message) => logger.info(`[CHATBOT] ${message}`)
logger.weather = (message) => logger.info(`[WEATHER] ${message}`)

module.exports = logger
