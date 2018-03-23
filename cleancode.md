# Clean Code

Avoid large blocks of code! if a method contains more than 10 lines or servers more than one purpose, maybe look into refactoring it!

```js
const PREFIX = '!'

client.on('message', message => {
    if(message.author.bot)  return

    if(message.content.startsWith(PREFIX)) {
        const args = message.content.split(' ')
        const command = args[0].slice(1)

        if(command === 'ping') {
            message.author.reply(`pong, ${args[1]}`)
        }
    }
})
```

Eventhough this code is simple **not** a single line of this code is describing what the code does. Various parts of this can be split out. For example:

```js
const PREFIX = '!'

client.on('message', handleMessage)

function handleMessage(msg) {
    if(isBotMessage(msg)) {
        return
    }

    if(isMessageCommand(msg)) {
        handleCommand(msg)
    }
}

function isBotMessage(msg) {
    return msg.author.bot
}

function isMessageCommand(msg) {
    return msg.content.startsWith(PREFIX)
}

function handleCommand(msg) {
    const args = message.content.split(' ')
    const command = args[0].slice(1)

    if(command === 'ping') {
        message.author.reply(`pong, ${args[1]}`)
    }
}
```

Despite this code taking up over twice as many lines as the previous block, this code is very easy to read and has a *flow* to it.
