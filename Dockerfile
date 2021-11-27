FROM node:16-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY src/package.json .
COPY src/package-lock.json .
RUN npm install
COPY src .
CMD [ "node", "app.js" ]
