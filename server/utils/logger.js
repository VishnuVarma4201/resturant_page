const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(({ message }) => message),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880
        })
    ]
});

// Create a stream object for Morgan
logger.stream = {
    write: (message) => logger.info(message.trim())
};

module.exports = logger;
