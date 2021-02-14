import React from 'react'
import { ThemeProvider } from '@material-ui/core/styles'

import Router from './Router'
import theme from '../utils/theme'
import { WalletProvider } from '../context/WalletContext'

const App = ({ location, routerContext }) => {
  return (
    <ThemeProvider theme={theme}>
      <WalletProvider>
        <Router location={location} context={routerContext} />
      </WalletProvider>
    </ThemeProvider>
  )
}

App.defaultProps = {
  location: { pathname: '/' },
  routerContext: {},
}

export default App
