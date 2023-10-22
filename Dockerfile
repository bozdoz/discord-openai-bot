FROM node:18-alpine3.16

WORKDIR /app

COPY package*.json ./

RUN npm ci --production

COPY src src

RUN chown -R node:node /app

USER node

CMD [ "npm", "start" ]
