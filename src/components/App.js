import React from 'react'
import { ThemeProvider } from '@material-ui/core/styles'

import Router from './Router'
import theme from '../utils/theme'
import Store from '../context/store'

const App = ({ location, routerContext }) => {
  return (
    <ThemeProvider theme={theme}>
      <Store>
        <Router location={location} context={routerContext} />
      </Store>
    </ThemeProvider>
  )
}

App.defaultProps = {
  location: { pathname: '/' },
  routerContext: {},
}

export default App
