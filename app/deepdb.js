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

    async getServerConfig(id) {
        let result = this._cachedServers[id]

        if (result) {
            logger.debug('from cache: ' + result)
            return result
        }
        result = await this._pool.query('SELECT data FROM config WHERE server_id=$1', [id]).rows

        if (result) {
            result = result[0].data

            logger.debug('from db: ' + result)

            this._cachedServers[id] = result
            return result
        }

        result = this.generateDefaultConfig()
        this._pool.query('INSERT INTO config (server_id, data) VALUES ($1, $2)', [id, JSON.stringify(result)])
        this._cachedServers[id] = result

        logger.debug('created config: ' + result)

        return result
    }

    generateDefaultConfig() {
        return {
            swearFilter: false,
            swearLevel: 0,
            filterImages: true
        }
    }

    updateServerConfig(id, callback) {
        const config = this.getServerConfig(id)

        callback(config)

        this.saveConfig(id, JSON.stringify(config))
    }

    saveConfig(id, config){
        this._pool.query('UPDATE config SET data = $1 WHERE server_id = $2', [config, id])
    }
}