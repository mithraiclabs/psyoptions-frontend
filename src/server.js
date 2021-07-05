import './config'
import path from 'path'
import fs from 'fs'
import express from 'express'
import cookieParser from 'cookie-parser'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ServerStyleSheets } from '@material-ui/core/styles'

import logger from './utils/server-logger'
import App from './components/App'
import LandingComingSoon from './components/pages/LandingComingSoon'
import Template from './components/server/template'

const bundleFilename = 'public/bundle.js'
let manifest = {}
let serviceWorkerManifest = {}
try {
  manifest = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'dist', 'assets-manifest.json')),
  )
  serviceWorkerManifest = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'dist', 'service-worker-manifest.json'),
    ),
  )
} catch (err) {
  manifest['main.js'] = bundleFilename
}

const server = express()

server.use((req, res, next) => {
  res.logger = logger.child({
    originalUrl: req.originalUrl,
    clientIp: req.socket?.remoteAddress,
    method: req.method,
  })
  logger.info(`HTTP ${req.method} ${req.originalUrl}`)
  next()
})

server.use(cookieParser())
server.use('/public', express.static('dist/public'))

// Service worker can't be in the public folder
server.get(/rate-limited-fetch-worker/, (req, res) => {
  res.sendFile(path.join(__dirname, serviceWorkerManifest['main.js']))
})

const {
  GRAPHQL_URL,
  LOCAL_PROGRAM_ID,
  MAINNET_PROGRAM_ID,
  TESTNET_PROGRAM_ID,
  DEVNET_PROGRAM_ID,
  LOCAL_DEX_PROGRAM_ID,
  TESTNET_DEX_PROGRAM_ID,
  DEVNET_DEX_PROGRAM_ID,
  OPTIONS_API_URL,
  APP_ENABLED = false,
  APP_PASSWORD,
  APP_PASSWORD_PROTECTED,
  INITIALIZE_PAGE_ENABLED,
  SHORT_SHA,
  TAG_NAME,
  SENTRY_ENVIRONMENT,
  DEVNET_FAUCET_USDC,
  DEVNET_FAUCET_BTC,
  DEVNET_FAUCET_PSY,
  USDC_SERUM_REFERRER_ADDRESS,
} = process.env

server.use((req, res) => {
  try {
    const routerCtx = { statusCode: 200 }

    let app
    let env

    if (APP_ENABLED) {
      app = (
        <App
          location={{ pathname: req?.originalUrl }}
          routerContext={routerCtx}
          ssrPassword={req.cookies?.password}
        />
      )
      env = {
        GRAPHQL_URL,
        LOCAL_PROGRAM_ID,
        MAINNET_PROGRAM_ID,
        TESTNET_PROGRAM_ID,
        DEVNET_PROGRAM_ID,
        LOCAL_DEX_PROGRAM_ID,
        TESTNET_DEX_PROGRAM_ID,
        DEVNET_DEX_PROGRAM_ID,
        OPTIONS_API_URL,
        APP_PASSWORD,
        APP_PASSWORD_PROTECTED,
        INITIALIZE_PAGE_ENABLED,
        SHORT_SHA,
        TAG_NAME,
        SENTRY_ENVIRONMENT,
        DEVNET_FAUCET_USDC,
        DEVNET_FAUCET_BTC,
        DEVNET_FAUCET_PSY,
        USDC_SERUM_REFERRER_ADDRESS,
        SERVICE_WORKER: serviceWorkerManifest['main.js'].match(
          /rate-limited-fetch-worker.*/,
        )[0],
      }
    } else {
      app = <LandingComingSoon />
    }

    const sheets = new ServerStyleSheets()
    const appHtml = ReactDOMServer.renderToString(sheets.collect(app))
    const cssString = sheets.toString()

    const html = ReactDOMServer.renderToString(
      <Template
        jsBundle={APP_ENABLED && manifest['main.js']}
        title="PsyOptions"
        description="Defi options trading protocol built on Solana"
        cssString={cssString}
        htmlString={appHtml}
        env={env}
      />,
    )

    if (routerCtx.statusCode >= 400) {
      res.logger.warn(`Server responded with ${routerCtx.statusCode} stats`)
    }

    res.status(routerCtx.statusCode)
    res.send(html)
  } catch (err) {
    // Hopefully this will never happen, but just in case
    res.logger.error(err)
    res.sendStatus(500)
  }
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\nServer listening at http://localhost:${port}/\n`)
  } else {
    console.log(`\nServer listening on port: ${port}\n`)
  }
})
