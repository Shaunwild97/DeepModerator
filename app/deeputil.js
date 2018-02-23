const request = require('request').defaults({ encoding: null })
const badwords = require('badwords/array')
const binarySearch = require('binarysearch')

const IMAGE_TYPES = ["png", "jpg", "bmp", "gif"]

module.exports = {
    isImage(filename) {
        const lowerCaseFileName = filename.toLowerCase()

        for (let type of IMAGE_TYPES) {
            if (lowerCaseFileName.includes(type)) {
                return true
            }
        }

        return false
    },

    requestImageBuffer(image) {
        return new Promise((resolve, reject) => {
            request.get(image, (err, res, body) => {
                if (!err && res.statusCode == 200) {
                    resolve(body)
                } else {
                    reject(err)
                }
            })
        })
    },

    textContainsSwear(text){
        const split = text.split(/\W/)

        for(let word of split){
            if(this.isSwearWord(word)) {
                return true
            }
        }
        
        return false
    },

    isSwearWord(word){
        return binarySearch(badwords, word) > -1
    },

    channelNeedsModeration(channel){
        return !(channel.nsfw || channel.name.includes('nsfw'))
    }
}