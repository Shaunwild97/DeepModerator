module.exports = {
    SharedIniFileCredentials: jest.fn(),
    config: {
        update: jest.fn()
    },
    Rekognition: class {
        detectModerationLabels(params, callback) {
            const data = {
                ModerationLabels: []
            }

            if (params.Image.Bytes.includes('bad_image')) {
                data.ModerationLabels = [
                    {
                        Name: 'Rude'
                    }
                ]
            }

            if(params.Image.Bytes.includes('error')) {
                callback('Error')
                return
            }

            callback(null, data)
        }

        detectText(params, callback) {
            const data = {
                TextDetections: [
                    {
                        DetectedText: (params.Image.Bytes.includes('bad_text') ? 'Curse damn' : 'Hello friend')
                    }
                ]
            }

            if(params.Image.Bytes.includes('error')) {
                callback('Error')
                return
            }

            callback(null, data)
        }
    }
}
