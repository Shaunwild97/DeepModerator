const { Command } = require('discord.js-commando')
const deepmod = require('../../../index')
const logger = require('../../deeplogger')

module.exports = class ToggleFilter extends Command {
    constructor(client) {
        super(client, {
            name: 'togglefilter',
            group: 'admin',
            memberName: 'togglefilter',
            description: 'Sets the state of the swear filter or displays the current swear filter state',
            examples: ['toggleFilter <on|off>'],
            args: [{
                key: 'state',
                prompt: 'on or off',
                type: 'string',
                validate: text => (text ==='on' || text === 'off'),
                guildOnly: true,
                default: 0
            }]  
        });
    }

    run(message, { state }) {
        const guildId = message.guild.id
        const config = deepmod.config

        if (state) {
            logger.debug(state)
            config.updateServerConfig(guildId, guildConfig => {
                guildConfig.swearFilter = (state === 'on')
            })
        } else {
            message.reply('Currently the swear filter is ' + (config.getServerConfig(guildId).swearFilter ? 'on' : 'off'))
        }
    }
}