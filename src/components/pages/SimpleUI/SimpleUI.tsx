import React, { useEffect } from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';

import ChooseAnAsset from './routes/ChooseAnAsset';
import UpOrDown from './routes/UpOrDown';
import ChooseExpiration from './routes/ChooseExpiration';

export const SimpleUI: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    // Redirect base path back to homepage
    if (location?.pathname.match(/\/simple\/?$/)) {
      history.replace('/');
    }
  }, [location, history]);

  return (
    <Switch>
      <Route component={ChooseAnAsset} path="/simple/choose-asset" />
      <Route component={UpOrDown} path="/simple/up-or-down" />
      <Route component={ChooseExpiration} path="/simple/choose-expiration" />
    </Switch>
  );
};
