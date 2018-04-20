module.exports = {
    defaults: jest.fn(() => module.exports),
    get(url, callback) {
        const res = {
            statusCode: 200
        }
        const body = url
        callback(null, res, body)
    }
}
