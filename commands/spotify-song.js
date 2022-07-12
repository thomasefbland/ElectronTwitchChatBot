async function executeCommand(client, channel, tags, message, self, spotifyApi) {
    const req = await spotifyApi.getMyCurrentPlaybackState();
    let songName = '';
    let artists = '';
    if(req.body.item != undefined) {
        songName = req.body.item.name;
        for (let i = 0; i < req.body.item.artists.length; i++) {
            if(i!==0) { artists += ' & '}
            artists += req.body.item.artists[i].name;
        }
    }
    const isPlaying = req.body.is_playing;

    if (isPlaying) {
        client.say(channel, `@${tags.username} Currently listening to: ${songName} by ${artists}`);
    } else {
        client.say(channel, `@${tags.username} Not currently listening to anything on Spotify`);
    }
}

const command = {
    name: "spotify-song",
    aliases: ["song"],
    permLevelRequired: 0,
    cooldown: 20,
    func: executeCommand,
    onCd: false
}

exports.command = command;