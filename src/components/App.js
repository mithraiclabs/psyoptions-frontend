import React from 'react'
import { ThemeProvider } from '@material-ui/core/styles'

import MainPage from './pages/main'
import theme from '../utils/theme'

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <MainPage />
    </ThemeProvider>
  )
}

export default App
