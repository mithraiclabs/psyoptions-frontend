FROM 'node:14-alpine'

ARG SENTRY_AUTH_TOKEN
ARG SHORT_SHA

WORKDIR app

ENV NODE_ENV='production'

COPY *.json ./

RUN npm ci --production

# This will re-copy json files, but oh well
COPY . ./

RUN npm run build

EXPOSE 3000

CMD node ./dist/index.js
