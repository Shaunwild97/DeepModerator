const index = require('../index')

test('handleMessage works for bad language', () => {
    const mockMessage = {
        content: 'this is a damn swear',
        reply: jest.fn()
    }

    index.handleMessage(mockMessage)

    const expected = 'Watch your language!'

    expect(mockMessage.reply).toHaveBeenCalledWith(expected)
})
