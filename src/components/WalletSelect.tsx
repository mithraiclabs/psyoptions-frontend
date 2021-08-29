import React from 'react';
import Dialog, { DialogProps } from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';

import wallets from '../utils/wallet/wallets';
import useWallet from '../hooks/useWallet';
import WalletAdapter from '../utils/wallet/walletAdapter';

const useStyles = makeStyles({
  icon: {
    width: '32px',
    height: '32px',
  },
});

const WalletSelect: React.FC<{
  open: boolean;
  onClose?: DialogProps['onClose'];
  handleConnect: (adapter: WalletAdapter) => void;
}> = ({ open, onClose, handleConnect }) => {
  const classes = useStyles();
  const { pubKey, connected, disconnect } = useWallet();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={'Choose Wallet'}>
      <Box px={3}>
        <Box
          width="350px"
          maxWidth="100%"
          display="flex"
          flexDirection="column"
        >
          <Box my={1} overflow="auto">
            {connected ? (
              <Box
                p={2}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
              >
                <h3 style={{ margin: 0 }}>Wallet Connected:</h3>
                <Box fontSize={12} my={2}>{`${pubKey}`}</Box>
                <Button variant="outlined" color="primary" onClick={disconnect}>
                  Disconnect
                </Button>
              </Box>
            ) : (
              <>
                {wallets.map((wallet) => {
                  const adapter = wallet.getAdapter();
                  const isAvailable = !!adapter;

                  return (
                    <Box my={2} key={wallet.name}>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        disabled={!isAvailable}
                        onClick={
                          isAvailable ? () => handleConnect(adapter) : null
                        }
                      >
                        <Box
                          width="100%"
                          display="flex"
                          flexDirection="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>{wallet.name}</Box>
                          <Box>
                            <img
                              src={wallet.icon}
                              alt={`${wallet.name} icon`}
                              className={classes.icon}
                            />
                          </Box>
                        </Box>
                      </Button>
                    </Box>
                  );
                })}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default WalletSelect;
