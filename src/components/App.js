import React from 'react'

import Store from '../context/store'
import Router from './Router'

const App = ({ location, routerContext }) => (
    <Store>
      <Router location={location} context={routerContext} />
    </Store>
  )

App.defaultProps = {
  location: { pathname: '/' },
  routerContext: {},
}

export default App
