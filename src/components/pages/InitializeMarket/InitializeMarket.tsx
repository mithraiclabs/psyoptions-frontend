import React, { useRef } from 'react';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Page from '../Page';
import theme from '../../../utils/theme';
import { InitOptionMarket } from './InitOptionMarket';
import { useInitializedMarkets } from '../../../hooks/LocalStorage';

const InitializeMarket: React.VFC = () => {
  const [initializedMarketMeta, setInitializedMarketMeta] =
    useInitializedMarkets();
  const textAreaRef = useRef(null);

  return (
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
      {initializedMarketMeta.length > 0 && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          minHeight="100%"
          width="100%"
          pt={0}
        >
          <Paper
            style={{ width: '100%', maxWidth: '500px', alignItems: 'center' }}
          >
            <Box
              display="flex"
              flex="1"
              alignItems="center"
              justifyContent="space-between"
              p={1}
            >
              <Box px={1}>
                <h3>Initialized Market Data</h3>
              </Box>
              <Box p={1} minWidth={'120px'}>
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={() => setInitializedMarketMeta([])}
                >
                  Clear data
                </Button>
              </Box>
            </Box>
            <Box display="flex">
              <Box fontSize={'12px'}>
                <Box p={1}>
                  Data from markets previously initialized by your browser in
                  JSON format appears here.
                </Box>
                <Box p={1} pt={0} display="block">
                  After initializing a market, you may submit a pull request to
                  our{' '}
                  <Link href="https://github.com/mithraiclabs/psyoptions-ts/tree/master/packages/market-meta">
                    market meta package
                  </Link>{' '}
                  for UI support.
                </Box>
              </Box>
            </Box>
            <Box p={2}>
              <TextareaAutosize
                ref={textAreaRef}
                onClick={() => {
                  if (textAreaRef?.current?.select) {
                    textAreaRef.current.select();
                  }
                }}
                value={JSON.stringify(initializedMarketMeta, null, 4)}
                spellCheck="false"
                style={{
                  padding: '16px',
                  border: `1px solid ${theme.palette.primary.light}`,
                  color: theme.palette.primary.main,
                  background: 'rgba(255,255,255,0.1)',
                  width: '100%',
                }}
              />
            </Box>
          </Paper>
        </Box>
      )}
    </Page>
  );
};

export default InitializeMarket;
