'use_strict'

const Commando = require('discord.js-commando')
const fs = require('fs')
const AWS = require('aws-sdk')
const DeepUtil = require('./app/deeputil')
const uuid = require('uuid')

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
    .then(() => console.log('Logged in to Discord'))
    .catch(console.error)

client
    .on('error', console.error)
    .on('warn', console.warn)
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
        .catch(console.error)
}

function handleImageModeration(blob, message) {
    let params = {
        Image: {
            Bytes: blob
        },
        MinConfidence: 0.7
    }

    rekognition.detectModerationLabels(params, (err, data) => {
        if (err) {
            console.error(err)
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
            console.error(err)
        } else {
            if (data.TextDetections.length) {
                for (let text of data.TextDetections) {
                    console.log(text.DetectedText)

                    if (DeepUtil.textContainsSwear(text.DetectedText)) {
                        removeNSFWMessage(message, `**<@!${message.author.id}>, Bad language was detected in your image.**`)
                        return
                    }
                }
            }
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