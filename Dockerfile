FROM public.ecr.aws/s6m7j8l9/node:14-alpine

ARG SENTRY_AUTH_TOKEN
ARG SHORT_SHA

WORKDIR app

ENV NODE_ENV='production'
ENV SHORT_SHA=$SHORT_SHA

COPY *.json ./
COPY *.lock ./

RUN yarn install --frozen-lockfile

# This will re-copy json files, but oh well
COPY . ./

RUN yarn build

EXPOSE 3000

CMD yarn start
