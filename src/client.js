import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'

import './client-config'

import App from './components/App'

// Don't log errors in local development
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    environment: process.env.SENTRY_ENVIRONMENT,
    dsn: 'https://f01c872e3d354a7ebcb3face8a11728e@o540422.ingest.sentry.io/5658746',
    integrations: [new Integrations.BrowserTracing()],
    release: `${process.env.SHORT_SHA}${
      (process.env.TAG_NAME && `:${process.env.TAG_NAME}`) || ''
    }`,

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  })
}

const run = async () => {
  try {
    if (navigator?.serviceWorker) {
      await navigator.serviceWorker.register(
        `/${window.process.env.SERVICE_WORKER}`,
      )
    }
  } catch (err) {
    Sentry.captureException(err)
  }

  ReactDOM.hydrate(
    <App suppressHydrationWarning />,
    document.querySelector('#app'),
  )
}

run()
