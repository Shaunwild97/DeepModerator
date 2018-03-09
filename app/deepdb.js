const { Pool } = require('pg')
const fs = require('fs')
const logger = require('./deeplogger')


module.exports = class {
    constructor() {
        this._pool = new Pool(JSON.parse(fs.readFileSync(require('os').homedir() + '/.nodekeys/deep-postgres-credentials.key', 'utf-8')))
        this._cachedServers = {}

        this.setupDB()
    }

    setupDB() {
        const configQuery = `CREATE TABLE IF NOT EXISTS config (
            id serial,
            server_id text,
            data text,
            PRIMARY KEY( id )
        );`

        this._pool.query(configQuery)
            .catch(logger.error)
    }

    async getServerConfig(guild) {
        let result = this._cachedServers[guild.id]

        if (result) {
            logger.debug('from cache: ' + JSON.stringify(result))
            return result
        }

        result = await this._pool.query("SELECT * FROM config WHERE server_id=$1", [guild.id])

        if (result.rowCount) {
            result = result.rows[0]

            logger.debug(`Loaded server config from database (${guild.id})`)

            result = JSON.parse(result.data)

            this._cachedServers[guild.id] = result
            return result
        }

        result = this.generateDefaultConfig(guild)
        this._pool.query('INSERT INTO config (server_id, data) VALUES ($1, $2)', [guild.id, JSON.stringify(result)])
        this._cachedServers[guild.id] = result

        logger.debug('created config: ' + JSON.stringify(this._cachedServers))

        return result
    }

    generateDefaultConfig(guild) {
        return {
            serverName: guild.name,
            swearFilter: false,
            swearLevel: 0,
            filterImages: true,
            joined: new Date(),
            lastUpdated: new Date()
        }
    }

    async updateServerConfig(guild, callback) {
        const config = await this.getServerConfig(guild)

        callback(config)

        this.updateEssentials(config, guild)

        this._cachedServers[guild.id] = config
        this.saveConfig(guild.id, JSON.stringify(config))
    }

    updateEssentials(config, guild){
        config.serverName = guild.name
        config.lastUpdated = new Date()
    }

    saveConfig(id, config){
        this._pool.query('UPDATE config SET data = $1 WHERE server_id = $2', [config, id])
    }
}