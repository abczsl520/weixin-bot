FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY bin/ ./bin/
COPY lib/ ./lib/
COPY LICENSE README.md ./

# No npm install needed — zero dependencies!

# Non-root user for security
RUN addgroup -S botuser && adduser -S botuser -G botuser
USER botuser

# Config volume
VOLUME /home/botuser/.weixin-bot

ENTRYPOINT ["node", "bin/weixin-bot.mjs"]
