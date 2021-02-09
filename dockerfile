FROM 'node:14-alpine'

WORKDIR app

ENV NODE_ENV='production'

COPY *.json .

RUN npm ci

# This will re-copy json files, but oh well
COPY . .

RUN npm run build

CMD cd dist && node ./index.js
