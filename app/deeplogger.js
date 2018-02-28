const winston = require('winston')

const winston_options = {
    json: true,
    timestamp: true,
    stringify: (obj) => JSON.stringify(obj),
    filename: 'deepmod.log',
    level: getLoggingLevel()
}

const logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(winston_options),
        new winston.transports.File(winston_options)
    ]
})

logger.info(`logging at level ${winston_options.level}`)

function getLoggingLevel(){
    const level = (process.env.DEEP_LOGGING ? process.env.DEEP_LOGGING : 'info')

    return level
}

module.exports = logger