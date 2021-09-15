import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import React, { useRef } from 'react';
import { useInitializedMarkets } from '../../../context/LocalStorage';
import theme from '../../../utils/theme';

export const InitializedMarkets: React.VFC = () => {
  const [initializedMarketMeta, setInitializedMarketMeta] =
    useInitializedMarkets();
  const textAreaRef = useRef(null);

  if (!initializedMarketMeta.length) {
    return null;
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      minHeight="100%"
      width="100%"
      pt={0}
    >
      <Paper style={{ width: '100%', maxWidth: '500px', alignItems: 'center' }}>
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
          <Box px={1}>
            <Box py={1} fontSize={'14px'}>
              Data from markets previously initialized by your browser in JSON
              format appears here.
            </Box>
            <Box py={1} px={0} display="block" fontSize={'14px'}>
              After initializing a market, you may submit a pull request to our{' '}
              <Link
                href="https://github.com/mithraiclabs/psyoptions-ts/tree/master/packages/market-meta"
                style={{ textDecoration: 'underline' }}
              >
                market meta package
              </Link>{' '}
              for UI support.
            </Box>
          </Box>
        </Box>
        <Box p={2}>
          <TextareaAutosize
            ref={textAreaRef}
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
  );
};
