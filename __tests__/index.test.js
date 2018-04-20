jest.mock('../app/deeplogger', () => {
    return {
        error: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn()
    }
})

const index = require('../index')
const logger = require('../app/deeplogger')
const { Collection } = require('discord.js')

test('handleMessage works for bad language not bot', async () => {
    const mockMessage = {
        content: 'this is a damn swear',
        delete: jest.fn(() => Promise.resolve({})),
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        guild: {
            id: 7777
        },
        attachments: {
            size: 0
        }
    }

    await index.handleMessage(mockMessage)

    const expected = '**<@!12345>, watch your language!**'

    expect(mockMessage.channel.send).toHaveBeenCalledWith(expected)
    expect(mockMessage.delete).toHaveBeenCalled()
})

test('handleMessage haults at bot', async () => {
    const mockMessage = {
        author: {
            bot: true
        }
    }

    expect(index.handleMessage(mockMessage)).toBe(false)
})

test('handleMessage for vulgar image', async () => {
    const attachments = new Collection()

    const badAttachment = {
        filename: 'bad_image.png',
        url: 'http://bad_image.com/bad_image.png'
    }

    attachments.set('222', badAttachment)

    const mockMessage = {
        delete: jest.fn(() => Promise.resolve({})),
        attachments,
        content: '',
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        guild: {
            id: 7777
        }
    }

    await index.handleMessage(mockMessage)

    const expected = '**<@!12345> This image has been detected as NSFW!**\n\nFlags: Rude'

    expect(mockMessage.channel.send).toHaveBeenCalledWith(expected)
    expect(mockMessage.delete).toHaveBeenCalled()
})

test('handleMessage for okay image', async () => {
    const attachments = new Collection()

    const badAttachment = {
        filename: 'bad_text.png',
        url: 'http://good_image.com/good_image.png'
    }

    attachments.set('252', badAttachment)

    const mockMessage = {
        delete: jest.fn(() => Promise.resolve({})),
        attachments,
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        content: '',
        guild: {
            id: 7777
        }
    }

    await index.handleMessage(mockMessage)

    expect(mockMessage.channel.send).not.toHaveBeenCalled()
    expect(mockMessage.delete).not.toHaveBeenCalled()
})

test('handleMessage for bad text in image', async () => {
    const attachments = new Collection()

    const badAttachment = {
        filename: 'bad_text.png',
        url: 'http://bad_text.com/bad_text.png'
    }

    attachments.set('252', badAttachment)

    const mockMessage = {
        delete: jest.fn(() => Promise.resolve({})),
        attachments,
        content: '',
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        guild: {
            id: 7777
        }
    }

    await index.handleMessage(mockMessage) //use debugger ot fix this

    const expected = '**<@!12345>, Bad language was detected in your image.**'

    expect(mockMessage.channel.send).toHaveBeenCalledWith(expected)
    expect(mockMessage.delete).toHaveBeenCalled()
})

test('handleMessage for bad text in url image', async () => {
    const mockMessage = {
        delete: jest.fn(() => Promise.resolve({})),
        attachments: {
            size: 0
        },
        content: 'Hey look http://bad_text.com/bad_text.png',
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        guild: {
            id: 7777
        }
    }

    await index.handleMessage(mockMessage) //use debugger ot fix this

    const expected = '**<@!12345>, Bad language was detected in your image.**'

    expect(mockMessage.channel.send).toHaveBeenCalledWith(expected)
    expect(mockMessage.delete).toHaveBeenCalled()
})

test('handleMessage for bad image in url image', async () => {
    const mockMessage = {
        delete: jest.fn(() => Promise.resolve({})),
        attachments: {
            size: 0
        },
        content: 'Hey look http://bad_image.com/bad_image.png',
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        guild: {
            id: 7777
        }
    }

    await index.handleMessage(mockMessage)

    const expected = '**<@!12345> This image has been detected as NSFW!**\n\nFlags: Rude'

    expect(mockMessage.channel.send).toHaveBeenCalledWith(expected)
    expect(mockMessage.delete).toHaveBeenCalled()
})

test('removeDuplicates works as expected', () => {
    const input = ["test", "test", "diff"]

    const expected = ["test", "diff"]

    expect(index.removeDuplicates(input)).toEqual(expected)
})

test('rekognition error logs error', async () => {
    jest.resetAllMocks()

    const mockMessage = {
        delete: jest.fn(() => Promise.resolve({})),
        attachments: {

        },
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        guild: {
            id: 7777
        },
        attachments: {
            size: 0
        }
    }

    await index.handleImageModeration('error', mockMessage)

    expect(logger.error).toHaveBeenCalledTimes(2)
})

test('handleJoinGuild sends message to welcome channel', async () => {
    const channels = new Collection()

    const expectedChannel = { name: 'general', send: jest.fn() }

    channels.set('23232', { name: 'other' })
    channels.set('12345', { name: 'random' })
    channels.set('25565', expectedChannel)

    const mockGuild = {
        channels: channels
    }

    await index.handleGuildJoin(mockGuild)

    expect(expectedChannel.send).toHaveBeenCalled()
})

test('hitting max filtered images send message', async () => {
    jest.resetModules()

    const attachments = new Collection()

    const badAttachment = {
        filename: 'bad_image.png',
        url: 'http://bad_image.com/bad_image.png'
    }

    attachments.set('222', badAttachment)

    const channels = new Collection()

    const expectedChannel = {
        name: 'general',
        send: jest.fn()
    }

    channels.set('222', expectedChannel)

    const mockMessage = {
        delete: jest.fn(() => Promise.resolve({})),
        attachments,
        content: '',
        author: {
            id: 12345,
            bot: false
        },
        channel: {
            type: "text",
            name: "general",
            send: jest.fn(() => Promise.resolve({})),
        },
        guild: {
            id: 249,
            channels
        }
    }

    await index.handleMessage(mockMessage)

    expect(expectedChannel.send).toHaveBeenCalled()
})
