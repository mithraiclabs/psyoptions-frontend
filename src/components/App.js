import React from 'react'
import { ThemeProvider } from '@material-ui/core/styles'

import Router from './Router'
import theme from '../utils/theme'

const App = ({ location, routerContext }) => {
  return (
    <ThemeProvider theme={theme}>
      <Router location={location} context={routerContext} />
    </ThemeProvider>
  )
}

App.defaultProps = {
  location: { pathname: '/' },
  routerContext: {},
}

export default App
