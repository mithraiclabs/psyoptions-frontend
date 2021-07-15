/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react'
import {
  Switch,
  Route,
  BrowserRouter,
  StaticRouter,
  BrowserRouterProps,
  StaticRouterProps,
} from 'react-router-dom'
import crypto from 'crypto'

import { isBrowser } from '../utils/isNode'

import usePassword from '../hooks/usePassword'

import Landing from './pages/Landing'
import LandingComingSoon from './pages/LandingComingSoon'
import Mint from './pages/Mint'
import InitializeMarket from './pages/InitializeMarket'
import OpenPositions from './pages/OpenPositions'
import History from './pages/History'
import Markets from './pages/Markets'
import Faucets from './pages/Faucets'
import NotFound from './pages/NotFound'
import ProhibitedJurisdiction from './pages/ProhibitedJurisdiction'
import { DISALLOWED_COUNTRIES, useCountry } from '../hooks/useCountry'
import { SimpleUI } from './pages/SimpleUI'

const { INITIALIZE_PAGE_ENABLED, APP_PASSWORD_PROTECTED, APP_PASSWORD } =
  process.env

const Router = isBrowser ? BrowserRouter : StaticRouter

const RouteWithStatusCode = ({ children, ...props }) => (
  <Route
    {...props}
    render={({ staticContext }) => {
      if (staticContext) {
        staticContext.statusCode = props.statusCode
      }
      return <>{children}</>
    }}
  />
)

const Routes: React.FC<any> = (props) => {
  const [password] = usePassword()
  const countryCode = useCountry()

  // Makes it a little harder for users to "break in" without being told the password
  // This makes it so they can't just paste the hash from the html into the cookie
  const hash = crypto
    .createHash('sha1')
    .update(props.ssrPassword || password) // eslint-disable-line
    .digest('hex')

  if (APP_PASSWORD_PROTECTED && APP_PASSWORD !== hash) {
    return (
      // @ts-ignore: Router JSX element type does not have any construct or call signatures
      <Router {...props}>
        <LandingComingSoon showPasswordField />
      </Router>
    )
  }

  // Checks and routes the user based on whether their country is prohited
  if (DISALLOWED_COUNTRIES.includes(countryCode)) {
    return (
      // @ts-ignore: Router JSX element type does not have any construct or call signatures
      <Router {...props}>
        <ProhibitedJurisdiction />
      </Router>
    )
  }

  return (
    // @ts-ignore: Router JSX element type does not have any construct or call signatures
    <Router {...props}>
      <Switch>
        <Route exact path="/">
          <Landing />
        </Route>
        <Route exact path="/markets">
          <Markets />
        </Route>
        <Route path="/simple">
          <SimpleUI />
        </Route>
        {INITIALIZE_PAGE_ENABLED && (
          <Route exact path="/initialize-market">
            <InitializeMarket />
          </Route>
        )}
        <Route exact path="/mint">
          <Mint />
        </Route>
        <Route exact path="/portfolio">
          <OpenPositions />
        </Route>
        <Route exact path="/faucets">
          <Faucets />
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
}

export default Routes
