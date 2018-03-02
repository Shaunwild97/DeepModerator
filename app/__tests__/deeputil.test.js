const DeepUtil = require('../deeputil')
const {Collection} = require('discord.js')

test('findSuitableReportingChannel works with bot_channel', () => {
    const channels = new Collection()

    const expectedChannel = {name: 'bot_channel'}

    channels.set('23232', {name: 'general'})
    channels.set('12345', expectedChannel)
    channels.set('25565', {name: 'other'})

    const mockServer = {
        channels,
    }

    expect(DeepUtil.findSuitableReportingChannel(mockServer)).toBe(expectedChannel)
})

test('findSuitableReportingChannel works without bot channel', () => {
    const channels = new Collection()

    const expectedChannel = {name: 'general'}

    channels.set('23232', {name: 'random'})
    channels.set('12345', expectedChannel)
    channels.set('25565', {name: 'other'})

    const mockServer = {
        channels,
    }

    expect(DeepUtil.findSuitableReportingChannel(mockServer)).toBe(expectedChannel)
})

test('findSuitableReportingChannel works without useful channel', () => {
    const channels = new Collection()

    const expectedChannel = {name: 'random2'}

    channels.set('23232', expectedChannel)
    channels.set('12345', {name: 'random'})
    channels.set('25565', {name: 'other'})

    const mockServer = {
        channels,
    }

    expect(DeepUtil.findSuitableReportingChannel(mockServer)).toBe(expectedChannel)
})

test('findSuitableReportingChannel works with random bot channel', () => {
    const channels = new Collection()

    const expectedChannel = {name: 'bot_talking'}

    channels.set('23232', {name: 'other'})
    channels.set('12345', {name: 'random'})
    channels.set('25565', expectedChannel)

    const mockServer = {
        channels,
    }

    expect(DeepUtil.findSuitableReportingChannel(mockServer)).toBe(expectedChannel)
})