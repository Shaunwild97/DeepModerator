module.exports = {
    Pool: class {
        query(query, params) {
            const returnedData = {
                rowCount: 1,
                rows: [{
                    serverid: 1235,
                    data: JSON.stringify({
                        serverName: 'testServer',
                        swearFilter: true,
                        swearLevel: 0,
                        filterImages: true,
                        joined: 123456,
                        lastUpdated: 654321,
                        memberCount: 100,
                        imageFilterCount: (params.includes('249') ? 249 : 50)
                    })
                }]
            }

            return new Promise(resolve => resolve(returnedData))
        }
    }
}
