import React from 'react'
import { Switch, Route, BrowserRouter, StaticRouter } from 'react-router-dom'
import { isBrowser } from '../utils/isNode'

import Main from './pages/main'
import Mint from './pages/Mint'
import InitializeMarket from './pages/InitializeMarket'
import OpenPositions from './pages/OpenPositions'
import History from './pages/History'
import Markets from './pages/Markets'
import NotFound from './pages/NotFound'

const Router = isBrowser ? BrowserRouter : StaticRouter
const RouteWithStatusCode = ({ children, ...props }) => (
  <Route
    {...props}
    render={({ routerContext }) => {
      if (routerContext) {
        routerContext.statusCode = props.statusCode
      }
      return <>{children}</>
    }}
  />
)

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
      <RouteWithStatusCode statusCode={404}>
        <NotFound />
      </RouteWithStatusCode>
    </Switch>
  </Router>
)

export default Routes
