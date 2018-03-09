const { Command } = require('discord.js-commando')
const deepmod = require('../../../index')
const logger = require('../../deeplogger')

module.exports = class ToggleFilter extends Command {
    constructor(client) {
        super(client, {
            name: 'swearfilter',
            group: 'admin',
            memberName: 'swearfilter',
            description: 'Sets the state of the swear filter or displays the current swear filter state',
            examples: ['swearfilter <on|off>'],
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
            config.updateServerConfig(message.guild, guildConfig => {
                logger.debug('cache in command: ' + JSON.stringify(guildConfig))
                guildConfig.swearFilter = (state === 'on')
                message.reply(`Swear filter has been turned ${state}`)
            })
        } else {
            config.getServerConfig(message.guild)
                .then(config => {
                    message.reply('Currently the swear filter is ' + (config.swearFilter ? 'on' : 'off'))
                })
        }
    }
}