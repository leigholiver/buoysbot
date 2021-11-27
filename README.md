# buoysbot
discord music bot cobbled together from stackoverflow comments

## usage
- `-play [song]` to play a song
    - `[song]` can be a youtube url, phrase to search in youtube, or one/more attached mp3 files
- `-skip` to skip to the next song
- `-stop` to stop playing and clear the song queue

## setup
requirements:
- docker
- docker-compose

first time setup:
- create a discord bot and get the token
    - here is a [guide](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)
    - when adding the bot to the server, replace `permissions=0` with `permissions=3148800`
        - `Read Messages/View Channels`
        - `Send Messages`
        - `Connect`
        - `Speak`
- copy `.env.example` to `.env` and add the token
- `docker-compose build`
- `docker-compose run buoysbot npm install`

run the bot:
- `docker-compose up`
