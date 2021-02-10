import './config'
import express from 'express'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ServerStyleSheets } from '@material-ui/core/styles'

import App from './components/App'
import Template from './components/server/template'

const bundleFilename = '/public/bundle.js'

const server = express()

server.get('/', (req, res, next) => {
  const sheets = new ServerStyleSheets()
  const appHtml = ReactDOMServer.renderToString(sheets.collect(<App />))
  const cssString = sheets.toString()

  const html = ReactDOMServer.renderToString(
    <Template
      jsBundle={bundleFilename}
      title="My App"
      description="My app description"
      cssString={cssString}
      htmlString={appHtml}
    />
  )
  res.send(html)
})

server.use('/public', express.static('public'))

const port = process.env.PORT || 3000

server.listen(port, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\nServer listening at http://localhost:${port}/\n`)
  }
})
