'use_strict'

const Commando = require('discord.js-commando')
const fs = require('fs')
const AWS = require('aws-sdk')
const DeepUtil = require('./app/deeputil')
const DeepStrings = require('./app/deepstrings')
const uuid = require('uuid')
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
        new winston.transports.Console(winston_options),
        new winston.transports.File(winston_options)
    ]
})

const IMAGE_REGEX = /(https?:\/\/.*\.(?:png|jpg))/i

const client = new Commando.Client({
    owner: '90589366191136768',
    commandPrefix: '-'
})

const credentials = new AWS.SharedIniFileCredentials({ profile: 'bot' })
AWS.config.credentials = credentials
AWS.config.update({ region: 'eu-west-1' })

const rekognition = new AWS.Rekognition()

client.registry
    .registerGroups([
        ['admin', 'Admin Commands']
    ])
    .registerDefaults()

client.login(fs.readFileSync(require('os').homedir() + '/.nodekeys/deep-token.key', 'utf-8'))
    .then(() => logger.info('Logged in to Discord'))
    .catch(logger.error)

client
    .on('error', logger.error)
    .on('warn', logger.warn)
    .on('guildCreate', handleGuildJoin)
    .on('guildDelete', handleGuildRemove)
    .on('message', handleMessage)
    .on('messageUpdate', (oldMessage, newMessage) => {
        handleMessage(newMessage)
    })

function handleMessage(message) {
    if (message.author.bot) {
        return
    }

    if (DeepUtil.channelNeedsModeration(message.channel)) {
        if (DeepUtil.textContainsSwear(message.content)) {
            removeNSFWMessage(message, `**<@!${message.author.id}>, watch your language!**`)
        }

        if (message.attachments.size) {
            handleAttachments(message)
        }

        handleUrlImages(message)
    }
}

function removeNSFWMessage(message, reason) {
    message.delete()
    message.channel.send(reason)
}

function handleUrlImages(message) {
    const imageMatches = matchMessageImages(message)

    if (imageMatches) {
        const uniqueImages = removeDuplicates(imageMatches)

        for (let image of uniqueImages) {
            moderateImage(message, image)
        }
    }
}

function handleAttachments(message) {
    for (let attachment of message.attachments.values()) {
        const filename = attachment.filename
        const isImage = DeepUtil.isImage(filename)

        if (isImage) {
            moderateImage(message, attachment.url)
        }
    }
}

function moderateImage(message, url) {
    DeepUtil.requestImageBuffer(url)
        .then(buffer => handleImageModeration(buffer, message))
        .catch(logger.error)
}

function handleGuildJoin(guild){
    logger.info(`Joined guild ${guild.name} (${guild.id})`)

    const welcomeChannel = findSuitableReportingChannel(guild)

    if(welcomeChannel) {
        welcomeChannel.send(DeepStrings.welcome)
    }
}

function handleGuildRemove(guild){
    logger.info(`Removed from guild ${guild.name} (${guild.id})`)
}

function handleImageModeration(blob, message) {
    let params = {
        Image: {
            Bytes: blob
        },
        MinConfidence: 0.6
    }

    rekognition.detectModerationLabels(params, (err, data) => {
        if (err) {
            logger.error(err)
        } else {
            if (data.ModerationLabels.length) {
                const content = gatherContent(data)
                removeNSFWMessage(message, `**<@!${message.author.id}> This image has been detected as NSFW!**\n\nFlags: ${content}`)
            }
        }
    })

    params = {
        Image: {
            Bytes: blob
        }
    }

    rekognition.detectText(params, (err, data) => {
        if (err) {
            logger.error(err)
        } else {
            if (data.TextDetections.length) {
                for (let text of data.TextDetections) {
                    logger.debug(text.DetectedText)

                    if (DeepUtil.textContainsSwear(text.DetectedText)) {
                        removeNSFWMessage(message, `**<@!${message.author.id}>, Bad language was detected in your image.**`)
                        return
                    }
                }
            }
        }
    })
}

function findSuitableReportingChannel(server) {
    const suitableChannels = ['bot_channel', 'bot_chat', 'bot', 'general']

    let backupChannel

    for (let suitable in suitableChannels) {
        for (let channel of server.channels.values()) {
            if (suitable === channel.name) {
                return channel
            }

            if (channel.name.includes('bot')) {
                backupChannel = channel
            }
        }

        return (backupChannel ? backupChannel : server.channels[0])
    }
}

function gatherContent(data) {
    const content = []

    for (let v of data.ModerationLabels) {
        content.push(v.Name)
    }

    return content.join(', ')
}

function matchMessageImages(message) {
    const content = message.content;
    return content.match(IMAGE_REGEX)
}

function removeDuplicates(images) {
    const uniqueImages = []

    for (let image of images) {
        if (!uniqueImages.includes(image)) {
            uniqueImages.push(image)
        }
    }

    return uniqueImages
}