const returnedData = {
    serverName: 'testServer',
    swearFilter: false,
    swearLevel: 0,
    filterImages: true,
    joined: 123456,
    lastUpdated: 654321,
    memberCount: 100,
    imageFilterCount: 50
}

export class Pool {
    query() {
        return returnedData
    }
}
