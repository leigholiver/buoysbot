const { PermissionsBitField } = require('discord.js');
const {
  createAudioResource,
  entersState,
  StreamType,
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
} = require('@discordjs/voice');

const maxTransmissionGap = 5000;

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
  if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
    return "I need the permissions to join and speak in your voice channel!";
  }

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
      maxMissedFrames: Math.round(maxTransmissionGap / 20),
    },
  });
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

  // Disable the udp keepalive to prevent the audio stopping after ~60s
  // https://github.com/discordjs/discord.js/issues/9185
  connection.on('stateChange', (oldState, newState) => {
    console.log("connection state change thing");
    const oldNetworking = Reflect.get(oldState, 'networking');
    const newNetworking = Reflect.get(newState, 'networking');

    const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
      const newUdp = Reflect.get(newNetworkState, 'udp');
      clearInterval(newUdp?.keepAliveInterval);
    }

    oldNetworking?.off('stateChange', networkStateChangeHandler);
    newNetworking?.on('stateChange', networkStateChangeHandler);
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
