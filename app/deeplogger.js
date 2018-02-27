const winston = require('winston')

winston.level = 'debug'

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

module.exports = logger