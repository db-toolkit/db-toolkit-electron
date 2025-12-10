/**
 * Application logging configuration.
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const os = require('os');
const fs = require('fs');

function setupLogger() {
  const logDir = path.join(os.homedir(), '.db-toolkit', 'logs');
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} - db_toolkit - ${level.toUpperCase()} - ${message}`;
      })
    ),
    transports: [
      // File handler with daily rotation (10MB max, keep 5 files)
      new DailyRotateFile({
        filename: path.join(logDir, 'app_%DATE%.log'),
        datePattern: 'YYYYMMDD',
        maxSize: '10m',
        maxFiles: '5d',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} - db_toolkit - ${level.toUpperCase()} - ${message}`;
          })
        )
      }),
      
      // Console handler (warnings and errors only)
      new winston.transports.Console({
        level: 'warn',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message }) => {
            return `${level} - ${message}`;
          })
        )
      })
    ]
  });

  return logger;
}

// Global logger instance
const logger = setupLogger();

module.exports = { logger };