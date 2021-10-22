import React from 'react';
import Brightness1 from '@material-ui/icons/Brightness1';
import {
  Box,
  Button
} from '@material-ui/core';
import { ConnectWalletButton } from "@gokiprotocol/walletkit";
import { useConnectedWallet, useSolana } from "@saberhq/use-solana";
import theme from '../utils/theme';

const WalletStatus: React.FC = () => {
  const { disconnect } = useSolana();
  const wallet = useConnectedWallet();
  const pubKeyB58 = wallet?.publicKey && wallet.publicKey.toBase58 && wallet.publicKey.toBase58().slice(0, 5);

  return (
    wallet?.connected ? 
    <Button onClick={disconnect}>
      <Box pr={2}>
        <Brightness1
          style={{
            fontSize: 12,
            color: theme.palette.success.main
          }}
        />
      </Box>
      {`Disconnect ${pubKeyB58}...`}
    </Button> : <ConnectWalletButton />
  );
};

export default WalletStatus;
