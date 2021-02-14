import React from 'react'
import { ThemeProvider } from '@material-ui/core/styles'

import Router from './Router'
import theme from '../utils/theme'
import { WalletProvider } from '../context/WalletContext'
import { ConnectionProvider } from '../context/ConnectionContext'

const App = ({ location, routerContext }) => {
  return (
    <ThemeProvider theme={theme}>
      <WalletProvider>
        <ConnectionProvider>
          <Router location={location} context={routerContext} />
        </ConnectionProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}

App.defaultProps = {
  location: { pathname: '/' },
  routerContext: {},
}

export default App
