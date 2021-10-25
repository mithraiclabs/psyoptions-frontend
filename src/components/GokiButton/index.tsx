import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ConnectWalletButton } from '@gokiprotocol/walletkit';

const useStyles = makeStyles(() => ({
  raiseZIndex: {
    zIndex: 1,
  }
}));

const GokiButton: React.VFC = () => {
  const styles = useStyles();
  return (
    <ConnectWalletButton className={styles.raiseZIndex}/>
  );
};

export default GokiButton;
