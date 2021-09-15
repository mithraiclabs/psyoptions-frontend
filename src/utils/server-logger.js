import '../config';
import winston, { format } from 'winston';

const isDev = process.env.NODE_ENV === 'development';

const devFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.splat(),
  format.errors(),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level} - ${message}`,
  ),
);

const transports = [];

transports.push(new winston.transports.Console());

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : format.json(),
  transports,
  // We don't run Jest yet but just so I don't forgot:
  silent: !!process.env.JEST_WORKER_ID,
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    promise,
  });
});

process.on('uncaughtException', (err) => {
  logger.error(err);
  process.exit(1);
});

export default logger;
