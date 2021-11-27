const {
  createAudioResource,
  entersState,
  StreamType,
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice');

function playSong(player, url) {
  const resource = createAudioResource(url, {
    inputType: StreamType.Arbitrary,
  });

  player.play(resource);
  return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

async function play(serverQueue, song) {
    await playSong(serverQueue.player, song.stream);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function stop(serverQueue) {
  if (!serverQueue) {
    return;
  }

  serverQueue.player.stop();
}

async function setupPlayer(client, guildId, textChannel, voiceChannel) {

  if (!voiceChannel) {
    return "You need to be in a voice channel to play music!";
  }

  const permissions = voiceChannel.permissionsFor(client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return "I need the permissions to join and speak in your voice channel!";
  }

  const player = createAudioPlayer();
  const connection = await connectToChannel(voiceChannel);
  connection.subscribe(player);

  const guildPlayer = {
    client: client,
    guildId: guildId,
    textChannel: textChannel,
    voiceChannel: voiceChannel,
    player: player,
    connection: connection,
    songs: [],
  };

  player.on('error', error => {
    console.error(error);
  });

  player.on(AudioPlayerStatus.Idle, () => {
    guildPlayer.songs.shift();

    if(guildPlayer.songs.length === 0) {
      return;
    }

    play(guildPlayer, guildPlayer.songs[0]);
  });

  return guildPlayer;
}

async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
    return connection;
  }
  catch (error) {
    connection.destroy();
    throw error;
  }
}

module.exports.play = play;
module.exports.stop = stop;
module.exports.setupPlayer = setupPlayer;
