import {
  ThemeProvider,
  StylesProvider,
  useMediaQuery,
} from '@material-ui/core';
import React, { useEffect } from 'react';
import ProhibitedJurisdiction from './components/ProhibitedJurisdiction';
import Store from './context/store';
import { DISALLOWED_COUNTRIES, useCountry } from './hooks/useCountry';
import useOptionsMarkets from './hooks/useOptionsMarkets';
import theme from './utils/theme';
import useScreenSize from './hooks/useScreenSize';
import {
  MOBILE_DEVICE_MEDIA_QUERY,
  TABLET_DEVICE_MEDIA_QUERY,
} from './context/ScreenSizeContext';
import { Routes } from "./routes";
import { HashRouter } from "react-router-dom";
import "./App.less";

const AppWithStore: React.FC = ({ children }) => {
  const { packagedMarkets } = useOptionsMarkets();
  const { updateFormFactor } = useScreenSize();
  const mobileDevice = !useMediaQuery(MOBILE_DEVICE_MEDIA_QUERY);
  const tabletDevice = !useMediaQuery(TABLET_DEVICE_MEDIA_QUERY);

  useEffect(() => {
    updateFormFactor(mobileDevice, tabletDevice);
  }, [updateFormFactor, mobileDevice, tabletDevice]);

  useEffect(() => {
    packagedMarkets();
  }, [packagedMarkets]);

  return <>{children}</>;
};

const App = (): JSX.Element | null => {
  const countryCode = useCountry();

  // This is a stupid fix for SSR not loading styles on first render.
  // We should eventually fix that and remove
  // const [meh, setMeh] = useState(true);
  // useEffect(() => {
  //   setMeh(false);
  // }, []);
  // if (meh) {
  //   return null;
  // }
  // end stupid fix

  return (
    <StylesProvider injectFirst>
      <ThemeProvider theme={theme}>
        <HashRouter basename={"/"}>
          <Store>
            <AppWithStore>{DISALLOWED_COUNTRIES.includes(countryCode ?? '') ? <ProhibitedJurisdiction /> : <Routes />}</AppWithStore>
          </Store>
        </HashRouter>
      </ThemeProvider>
    </StylesProvider>
  );
};
export default App;
