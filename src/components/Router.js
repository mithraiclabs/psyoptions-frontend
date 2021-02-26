import React from 'react'
import { Switch, Route, BrowserRouter, StaticRouter } from 'react-router-dom'
import { isBrowser } from '../utils/isNode'

import Main from './pages/main'
import Mint from './pages/Mint'
import InitializeMarket from './pages/InitializeMarket'
import OpenPositions from './pages/OpenPositions'
import History from './pages/History'
import Markets from './pages/Markets'

const Router = isBrowser ? BrowserRouter : StaticRouter

const Routes = (props) => (
  <Router {...props}>
    <Switch>
      <Route exact path="/">
        <Main />
      </Route>
      <Route exact path="/markets">
        <Markets />
      </Route>
      <Route exact path="/initialize-market">
        <InitializeMarket />
      </Route>
      <Route exact path="/mint">
        <Mint />
      </Route>
      <Route exact path="/open-positions">
        <OpenPositions />
      </Route>
      <Route exact path="/history">
        <History />
      </Route>
    </Switch>
  </Router>
)

export default Routes
