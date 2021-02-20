import React from 'react'
import ReactDOM from 'react-dom'

import './client-config.js'

import App from './components/App'

ReactDOM.hydrate(
  <App suppressHydrationWarning />,
  document.querySelector('#app')
)
