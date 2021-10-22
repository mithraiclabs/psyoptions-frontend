import { Route, Switch, Redirect } from "react-router-dom";
import React from "react";
import Landing from "./Landing";
import Markets from "./pages/markets";
import Faucet from "./pages/faucets";
import InitializeMarkets from "./pages/initialize-market";
import Custom404 from "./404";
import Portfolio from "./pages/portfolio";
import SimpleUI from "./pages/simple/choose-asset";
import Mints from "./pages/mint";

export function Routes() {

  return (
    <Switch>
      <Route exact path="/" children={<Landing />} />
      <Route exact path="/markets" children={<Markets />} />
      <Route exact path="/mint" children={<Mints />} />
      <Route exact path="/initialize-market" children={<InitializeMarkets />} />
      <Route exact path="/faucets" children={<Faucet />} />
      <Route exact path="/portfolio" children={<Portfolio />} />
      <Route exact path="/simple/choose-asset" children={<SimpleUI />} />
      <Route exact path="/not-found" children={<Custom404 />} />
      <Route exact path="*"><Redirect
        to={{
          pathname: "/not-found"
        }}
      /></Route>
  </Switch>
  );
}
