function executeCommand(client, channel, tags, message, self) {
    client.say(channel, `@${tags.username} pong!`);
}

const command = {
    name: "ping",
    aliases: ["ping"],
    permLevelRequired: 15,
    cooldown: 20,
    func: executeCommand,
    onCd: false
}

exports.command = command;