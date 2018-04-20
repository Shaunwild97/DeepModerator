if (msg === "buy") {
    const user = await economy.fetchBalance(message.author.id)
    
    if (user.money >= 499) {
        const user = await economy.updateBalance(message.author.id, -499)
        message.channel.send(`thank you for buying, price was 499, now you have ${i.money}`)
    } else {
        message.channel.send("sorry you don't have enough money");
    }
}
