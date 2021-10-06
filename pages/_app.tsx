import { ThemeProvider } from '@material-ui/core/styles';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React, { useEffect } from 'react';
import ProhibitedJurisdiction from '../src/components/ProhibitedJurisdiction';
import Store from '../src/context/store';
import { DISALLOWED_COUNTRIES, useCountry } from '../src/hooks/useCountry';
import useOptionsMarkets from '../src/hooks/useOptionsMarkets';
import theme from '../src/utils/theme';

const AppWithStore: React.FC = ({ children }) => {
  const { packagedMarkets } = useOptionsMarkets();

  useEffect(() => {
    packagedMarkets();
  }, [packagedMarkets]);

  return <>{children}</>;
};

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
  const countryCode = useCountry();

  let content = <Component {...pageProps} />;

  if (DISALLOWED_COUNTRIES.includes(countryCode ?? '')) {
    content = <ProhibitedJurisdiction />;
  }

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <ThemeProvider theme={theme}>
        <Store>
          <AppWithStore>{content}</AppWithStore>
        </Store>
      </ThemeProvider>
    </>
  );
};
export default App;
