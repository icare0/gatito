const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.level}: ${info.message}: ${info.timestamp}`)
  ),
  transports: [
    new transports.File({ filename: 'log.txt' }),
    new transports.Console()
  ]
});

module.exports = logger;
