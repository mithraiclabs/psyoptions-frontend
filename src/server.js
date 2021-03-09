import './config'
import path from 'path'
import fs from 'fs'
import express from 'express'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ServerStyleSheets } from '@material-ui/core/styles'

import logger from './utils/server-logger'
import App from './components/App'
import Template from './components/server/template'

const bundleFilename = 'public/bundle.js'
let manifest = {}
try {
  manifest = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'dist', 'assets-manifest.json')),
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

server.use('/public', express.static('dist/public'))

const {
  LOCAL_PROGRAM_ID,
  MAINNET_PROGRAM_ID,
  TESTNET_PROGRAM_ID,
  DEVNET_PROGRAM_ID,
  OPTIONS_API_URL,
} = process.env

server.use((req, res) => {
  try {
    const routerCtx = { statusCode: 200 }
    const app = (
      <App
        location={{ pathname: req?.originalUrl }}
        routerContext={routerCtx}
      />
    )
    const sheets = new ServerStyleSheets()
    const appHtml = ReactDOMServer.renderToString(sheets.collect(app))
    const cssString = sheets.toString()

    const html = ReactDOMServer.renderToString(
      <Template
        jsBundle={manifest['main.js']}
        title="PsyOptions"
        description="Defi options trading protocol built on Solana"
        cssString={cssString}
        htmlString={appHtml}
        env={{
          LOCAL_PROGRAM_ID,
          MAINNET_PROGRAM_ID,
          TESTNET_PROGRAM_ID,
          DEVNET_PROGRAM_ID,
          OPTIONS_API_URL,
        }}
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
  }
})
