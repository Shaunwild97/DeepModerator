const winston = require('winston')

const winston_options = {
    json: true,
    timestamp: true,
    stringify: (obj) => JSON.stringify(obj),
    filename: 'deepmod.log'
}

const logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(Object.assign(winston_options, {level: 'debug'})),
        new winston.transports.File(Object.assign(winston_options, {level: 'info'}))
    ]
})

winston.level = getLoggingLevel()

function getLoggingLevel(){
    const level = (process.env.DEEP_LOGGING ? process.env.DEEP_LOGGING : 'info')
    logger.info(`logging at level ${level}`)

    return level
}

module.exports = logger