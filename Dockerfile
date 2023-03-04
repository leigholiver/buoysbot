FROM node:19-alpine3.16
RUN apk add --no-cache ffmpeg libsodium
WORKDIR /app
COPY src/package.json .
COPY src/package-lock.json .
RUN npm install
COPY src .
CMD [ "node", "app.js" ]
