import {
  ThemeProvider,
  StylesProvider,
  useMediaQuery,
} from '@material-ui/core';
import React, { useEffect } from 'react';
import Store from './context/store';
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

  return (
    <StylesProvider injectFirst>
      <ThemeProvider theme={theme}>
        <HashRouter basename={"/"}>
          <Store>
            <AppWithStore><Routes /></AppWithStore>
          </Store>
        </HashRouter>
      </ThemeProvider>
    </StylesProvider>
  );
};
export default App;
