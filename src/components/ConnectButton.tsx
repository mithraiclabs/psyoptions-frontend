import React, { useState } from 'react';
import Button from '@material-ui/core/Button';

import WalletAdapter from '../utils/wallet/walletAdapter';
import useWallet from '../hooks/useWallet';
import WalletSelect from './WalletSelect';

const ConnectButton = (props) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { connect, connected } = useWallet();
  const { children } = props;

  const handleConnect = async (adapter: WalletAdapter) => {
    await connect(adapter, {});
    setIsSelectOpen(false);
  };

  return (
    <>
      <WalletSelect
        open={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        handleConnect={handleConnect}
      />
      <Button
        color="primary"
        onClick={() => setIsSelectOpen(true)}
        variant="outlined"
        style={{ whiteSpace: 'nowrap' }}
        {...props}
      >
        {children}
      </Button>
    </>
  );
};

export default ConnectButton;
