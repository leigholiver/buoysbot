const { Client, Intents }  = require('discord.js');
const ytdl = require("ytdl-core");
const yts = require("yt-search");

const { play, stop, setupPlayer } = require('./playback.js');

const prefix = process.env.PREFIX ?? "-";
const token = process.env.DISCORD_TOKEN;

const queue = new Map();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES
  ],
});
client.login(token);

client.on('ready', async () => {
  console.log('Logged in as ' + client.user.tag);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  let serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    const args = message.content.split(" ");
    let songs = [];

    if (ytdl.validateURL(args[1])) {
      const songInfo = await ytdl.getInfo(args[1]);
      songs = [{
        title: songInfo.videoDetails.title,
        stream: ytdl(songInfo.videoDetails.video_url, { filter: 'audioonly', dlChunkSize: 0 }),
      }];
    }
    else if (message.attachments && message.attachments.size > 0) {
      for (let file of message.attachments) {
        if(file[1].contentType === 'audio/mpeg') {
          songs.push({
            title: file[1].name,
            stream: file[1].url,
          });
        }
      }
    }
    else {
      const {videos} = await yts(args.slice(1).join(" "));
      if (!videos.length) return message.channel.send("No songs were found!");
      songs = [{
        title: videos[0].title,
        stream: ytdl(videos[0].url, { filter: 'audioonly', dlChunkSize: 0 }),
      }];
    }

    // if the queue exists, just queue the songs
    if(serverQueue && serverQueue.songs.length > 0) {
      for (let song of songs) {
        serverQueue.songs.push(song);
        message.channel.send(`${song.title} has been added to the queue!`);
      }
      return;
    }

    // set up a queue and play the songs
    serverQueue = await setupPlayer(message.client, message.guild.id, message.channel, message.member.voice.channel);
    if (typeof serverQueue === 'string' || serverQueue instanceof String) {
      // there was a problem...
      message.channel.send(serverQueue);
      return;
    }

    serverQueue.songs = songs;
    play(serverQueue, serverQueue.songs[0]);
    queue.set(message.guild.id, serverQueue);

    for (let song of songs.slice(1)) {
      message.channel.send(`${song.title} has been added to the queue!`);
    }
  }
  else if (message.content.startsWith(`${prefix}skip`)) {
    if(canAdmin(message, serverQueue)) {
      stop(serverQueue);
    }
  }
  else if (message.content.startsWith(`${prefix}stop`)) {
    if(canAdmin(message, serverQueue)) {
      serverQueue.songs = []
      stop(serverQueue);
    }
  }
});

function canAdmin(message, serverQueue) {
  if(!serverQueue) {
    return false;
  }

  if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
    message.channel.send("You have to be in the same voice channel as the bot to stop the music!");
    return false;
  }

  return true;
}
