import {
  ThemeProvider,
  StylesProvider,
  useMediaQuery,
} from '@material-ui/core';
import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import Store from './context/store';
import useOptionsMarkets from './hooks/useOptionsMarkets';
import theme from './utils/theme';
import useScreenSize from './hooks/useScreenSize';
import {
  MOBILE_DEVICE_MEDIA_QUERY,
  TABLET_DEVICE_MEDIA_QUERY,
} from './context/ScreenSizeContext';
import { Routes } from './routes';
import { RecoilDevTool } from './recoil';
import { useLoadOptionMarkets } from './hooks/PsyOptionsAPI/useLoadOptionMarkets';
import './App.less';

const AppWithStore: React.FC = ({ children }) => {
  const { packagedMarkets } = useOptionsMarkets();
  const { updateFormFactor } = useScreenSize();
  const mobileDevice = !useMediaQuery(MOBILE_DEVICE_MEDIA_QUERY);
  const tabletDevice = !useMediaQuery(TABLET_DEVICE_MEDIA_QUERY);

  useLoadOptionMarkets();

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
    <RecoilRoot>
      <RecoilDevTool />
      <StylesProvider injectFirst>
        <ThemeProvider theme={theme}>
          <HashRouter basename={'/'}>
            <Store>
              <AppWithStore>
                <Routes />
              </AppWithStore>
            </Store>
          </HashRouter>
        </ThemeProvider>
      </StylesProvider>
    </RecoilRoot>
  );
};
export default App;
