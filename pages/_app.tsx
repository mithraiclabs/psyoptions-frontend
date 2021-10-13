import {
  ThemeProvider,
  StylesProvider,
  useMediaQuery,
} from '@material-ui/core';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import ProhibitedJurisdiction from '../src/components/ProhibitedJurisdiction';
import Store from '../src/context/store';
import { DISALLOWED_COUNTRIES, useCountry } from '../src/hooks/useCountry';
import useOptionsMarkets from '../src/hooks/useOptionsMarkets';
import theme from '../src/utils/theme';
import useScreenSize from '../src/hooks/useScreenSize';
import {
  MOBILE_DEVICE_MEDIA_QUERY,
  TABLET_DEVICE_MEDIA_QUERY,
} from '../src/context/ScreenSizeContext';

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

const App = ({ Component, pageProps }: AppProps): JSX.Element | null => {
  const countryCode = useCountry();

  // This is a stupid fix for SSR not loading styles on first render.
  // We should eventually fix that and remove
  const [meh, setMeh] = useState(true);
  useEffect(() => {
    setMeh(false);
  }, []);
  if (meh) {
    return null;
  }
  // end stupid fix

  let content = <Component {...pageProps} />;

  if (DISALLOWED_COUNTRIES.includes(countryCode ?? '')) {
    content = <ProhibitedJurisdiction />;
  }

  return (
    <StylesProvider injectFirst>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <ThemeProvider theme={theme}>
        <Store>
          <AppWithStore>{content}</AppWithStore>
        </Store>
      </ThemeProvider>
    </StylesProvider>
  );
};
export default App;
