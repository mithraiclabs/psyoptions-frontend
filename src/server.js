import './config'
import express from 'express'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ServerStyleSheets } from '@material-ui/core/styles'

import App from './components/App'
import Template from './components/server/template'

const bundleFilename = '/public/bundle.js'

const server = express()

server.use('/public', express.static('dist/public'))

const {
  LOCAL_PROGRAM_ID,
  MAINNET_PROGRAM_ID,
  TESTNET_PROGRAM_ID,
  DEVNET_PROGRAM_ID,
  OPTIONS_API_URL,
} = process.env

server.use((req, res, next) => {
  const routerCtx = { statusCode: 200 }
  const app = (
    <App location={{ pathname: req?.originalUrl }} routerContext={routerCtx} />
  )
  const sheets = new ServerStyleSheets()
  const appHtml = ReactDOMServer.renderToString(sheets.collect(app))
  const cssString = sheets.toString()

  const html = ReactDOMServer.renderToString(
    <Template
      jsBundle={bundleFilename}
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
    />
  )
  res.status(routerCtx.statusCode)
  res.send(html)
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\nServer listening at http://localhost:${port}/\n`)
  }
})
