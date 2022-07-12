async function executeCommand(client, channel, tags, message, self, spotifyApi) {
    const req = await spotifyApi.getMyCurrentPlaybackState();
    const context = req.body.context;
    const isPlaying = req.body.is_playing;

    if (context != null && context.type == 'playlist' && isPlaying) {
        const playlistUrl = context.external_urls.spotify;
        client.say(channel, `@${tags.username} Currently listening to: ${playlistUrl}`);
    } else {
        client.say(channel, `@${tags.username} Not currently listening to a Spotify playlist`);
    }
}

const command = {
    name: "spotify-playlist",
    aliases: ["playlist"],
    permLevelRequired: 0,
    cooldown: 20,
    func: executeCommand,
    onCd: false
}

exports.command = command;