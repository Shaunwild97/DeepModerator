'use_strict'

const Commando = require('discord.js-commando')
const fs = require('fs')
const AWS = require('aws-sdk')
const DeepUtil = require('./app/deeputil')
const DeepStrings = require('./app/deepstrings')
const uuid = require('uuid')
const DeepDB = require('./app/deepdb')
const logger = require('./app/deeplogger')
const path = require('path')

const IMAGE_REGEX = /(https?:\/\/.*\.(?:png|jpg))/i

const MAX_FILTERED_IMAGES = 250

const client = new Commando.Client({
    owner: '90589366191136768',
    commandPrefix: 'dm?'
})

const credentials = new AWS.SharedIniFileCredentials({ profile: 'bot' })
AWS.config.credentials = credentials
AWS.config.update({ region: 'eu-west-1' })

const rekognition = new AWS.Rekognition()

const config = new DeepDB()

module.exports = {
    config,
    handleMessage,
    handleImageModeration,
    removeDuplicates,
    handleGuildJoin,
    handleGuildRemove,
    moderateImage
}

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['admin', 'Admin Commands']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'app/commands'));

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
        return false
    }

    if (message.content.substring(0, 3) === 'dm?') {
        return false
    }

    if (DeepUtil.channelNeedsModeration(message.channel)) {
        return config.getServerConfig(message.guild)
            .then(serverConfig => {
                if (serverConfig.swearFilter) {
                    if (DeepUtil.textContainsSwear(message.content)) {
                        removeNSFWMessage(message, `**<@!${message.author.id}>, watch your language!**`)
                    }
                }

                if (serverConfig.filterImages) {
                    if (message.attachments.size) {
                        handleAttachments(message)
                    }

                    handleUrlImages(message)
                }
            })
    }
}

function removeNSFWMessage(message, reason) {
    message.delete()
        .catch(logger.debug)
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
    return DeepUtil.requestImageBuffer(url)
        .then(buffer => handleImageModeration(buffer, message))
        .catch(logger.error)
}

function handleGuildJoin(guild) {
    logger.info(`Joined guild ${guild.name} (${guild.id})`)

    const welcomeChannel = DeepUtil.findSuitableReportingChannel(guild)

    if (welcomeChannel) {
        welcomeChannel.send(DeepStrings.welcome)
    }
}

function handleGuildRemove(guild) {
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

    config.updateServerConfig(message.guild, config => {
        config.imageFilterCount++

        console.log(config.imageFilterCount)

        if (config.imageFilterCount == MAX_FILTERED_IMAGES) {
            config.filterImages = false

            const channel = DeepUtil.findSuitableReportingChannel(message.guild)
            channel.send(DeepStrings.max_images_filtered)
                .catch(logger.error)
        }
    })
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
