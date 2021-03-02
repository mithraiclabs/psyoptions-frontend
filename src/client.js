import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'

import './client-config'

import App from './components/App'

// Don't log errors in local development
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn:
      'https://f01c872e3d354a7ebcb3face8a11728e@o540422.ingest.sentry.io/5658746',
    integrations: [new Integrations.BrowserTracing()],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  })
}

ReactDOM.hydrate(
  <App suppressHydrationWarning />,
  document.querySelector('#app'),
)
