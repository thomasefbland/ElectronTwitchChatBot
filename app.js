require('dotenv').config();

// 
// 
// SPOTIFY LOGIN/REFRESH ACCESS
// 
// 


const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');

const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
];

var spotifyApi = new SpotifyWebApi({
    clientId: process.env['spotifyClientId'],
    clientSecret: process.env['spotifyClientSecret'],
    redirectUri: 'http://localhost:8888/callback'
})

const expApp = express();
expApp.set('views', __dirname + '/views');
expApp.set('view engine', 'ejs');
expApp.use(express.static(__dirname));

expApp.get('/', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
  });

expApp.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;

    if (error) {
      console.error('Callback Error:', error);
      res.send(`Callback Error: ${error}`);
      return;
    }
  
    spotifyApi
      .authorizationCodeGrant(code)
      .then(data => {
        const access_token = data.body['access_token'];
        const refresh_token = data.body['refresh_token'];
        const expires_in = data.body['expires_in'];
  
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);
  
        console.log(
          `Sucessfully retreived access token. Expires in ${expires_in} s.`
        );
        res.render("callback", { name: `${process.env['twitchChannel']}`, message: "Success! You can now close the window." });
  
        setInterval(async () => {
          const data = await spotifyApi.refreshAccessToken();
          const access_token = data.body['access_token'];
  
          console.log('The access token has been refreshed!');
          console.log('access_token:', access_token);
          spotifyApi.setAccessToken(access_token);
        }, expires_in / 2 * 1000);
      })
      .catch(error => {
        console.error('Error getting Tokens:', error);
        res.render("callback", { message: `Error getting Tokens: ${error}` });
      });

});

expApp.listen(8888, () => {
    console.log('HTTPS Server up.');
});




// 
//
// Electron App Section
// 
// 

const {app,BrowserWindow,Menu, Tray} = require('electron');

let isQuitting = false;
app.on('before-quit', function() {
    isQuitting = true;
});

var tray = null;

async function createWindow() {
    const window = new BrowserWindow({
        width: 1000,
        height: 800,
        icon: './app_icon.png'
    });

    window.removeMenu(true);
    window.setResizable(false);

    window.on('page-title-updated', function (event) {
        event.preventDefault();
    });

    window.setTitle(`${process.env['twitchChannel']}Bot - Electron v${process.versions['electron']}`);
    
    window.loadURL("http:localhost:8888");



    window.on('minimize', function (event) {
        event.preventDefault();
        window.hide();
    });

    window.on('close', function (event) {
        if(!isQuitting) {
            event.preventDefault();
            window.hide();
        }
    });


    const contextMenu = Menu.buildFromTemplate([
        { label : 'Show App', click: function() {
            window.show();
        } },
        { label: 'Exit App', click: function() {
            isQuitting = true;
            app.quit();
        } }
    ]);

    tray = new Tray('./system_tray_icon.png');
    tray.setContextMenu(contextMenu);
}


app.whenReady().then( () => {
    createWindow();
});


//
// 
// TWITCH CHAT BOT SECTION
// 
// 

const tmi = require("tmi.js");

const client = new tmi.Client({
    connection: {
        secure: true,
        reconnect: true,
    },
    identity: {
        username: process.env['twitchChannel'],
        password: process.env['twitchoauthtoken'],
    },
    channels: [process.env['twitchChannel']]
});

const commands = new Map();
const fs = require('fs');
(async function() {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const { command } = await require(`./commands/${file}`);

        commands.set(command.name, command);
    }

})();

client.connect();

async function handleCommand(channel, tags, message, self) {
    if(self) return;
  
    if(message.startsWith("!")) {
  
        var permLevel = 0;
        if(tags.badges != null) {
            if(tags.badges.subscriber != undefined) {
                permLevel +=1;
            }
            if(tags.badges.vip != undefined) {
                permLevel +=5;
            }
            if(tags.badges.moderator) {
                permLevel +=10;
            }
        }
        if (tags.username == process.env['twitchChannel']) {
            permLevel +=10;
        }
  
  
        const commandArg = message.trim().split(" ")[0].substring(1).toLowerCase();
        let result;
        commands.forEach(cmd => {
            if(cmd.aliases.includes(commandArg)) {
                result = cmd;
            }
        });
        if (result != undefined) {
            if (result.permLevelRequired <= permLevel && result.onCd == false) {
                if(result.name=="spotify-playlist" || result.name=="spotify-song") {
                  result.func(client, channel, tags, message, self, spotifyApi);
                } else {
                  result.func(client, channel, tags, message, self);
                }
                result.onCd = true;
                setTimeout(() => {result.onCd = false}, result.cooldown * 1000);
            }
        }
  
    }
  }
  
  client.on('message', (channel, tags, message, self) => {
      handleCommand(channel, tags, message, self);
  })