import React from 'react';
import Box from '@material-ui/core/Box';
import Page from '../Page';
import { InitOptionMarket } from './InitOptionMarket';
import { InitializedMarketsProvider } from '../../../context/LocalStorage';
import { InitializedMarkets } from './InitializedMarkets';

const InitializeMarket: React.VFC = () => {
  return (
    <InitializedMarketsProvider>
      <Page>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          minHeight="100%"
          p={[0, 0, 4]}
        >
          <InitOptionMarket />
        </Box>
        <InitializedMarkets />
      </Page>
    </InitializedMarketsProvider>
  );
};

export default InitializeMarket;
