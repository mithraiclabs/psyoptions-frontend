import React, { useEffect } from 'react';
import { StaticRouterProps } from 'react-router-dom';
import Store from '../context/store';
import useOptionsMarkets from '../hooks/useOptionsMarkets';
import Router from './Router';

const App = ({ location = { pathname: '/' }, context = {}, ssrPassword }) => {
  const { packagedMarkets } = useOptionsMarkets();

  useEffect(() => {
    packagedMarkets();
  }, [packagedMarkets]);

  return (
    <Router location={location} context={context} ssrPassword={ssrPassword} />
  );
};

const WrappedApp = (props) => {
  return (
    <Store>
      <App {...props} />
    </Store>
  );
};

export default WrappedApp;
