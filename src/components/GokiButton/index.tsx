import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ConnectWalletButton } from '@gokiprotocol/walletkit';
import { createLocalStorageStateHook } from 'use-local-storage-state';
import Disclaimer from '../Disclaimer';
import { useState } from 'react';

export const useDisclaimerState = createLocalStorageStateHook('hasAcceptedDisclaimer', false);

const useStyles = makeStyles(() => ({
  gokiButton: {
    zIndex: 1,
  },
  gokiButtonPlaceHolder: {
    display: 'block !important'
  },
  disclaimerButtonContainer: {
    zIndex: 1,
    position: 'relative'
  },
  disclaimerButton: {
    bottom: 0,
    cursor: 'pointer',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
    zIndex: 99
  }
}));

const GokiButton: React.VFC = () => {
  const styles = useStyles();

  const [hasAcceptedDisclaimer] = useDisclaimerState();

  const [showDisclaimer, setDisclaimerVisible] = useState(false);

  return (
    <>
      {
        (hasAcceptedDisclaimer)
          ? <ConnectWalletButton className={styles.gokiButton} />
          : <div className={styles.disclaimerButtonContainer}>
              <ConnectWalletButton className={styles.gokiButtonPlaceHolder} />
              <div className={styles.disclaimerButton} onClick={()=>{
                setDisclaimerVisible(true);
              }}>
              </div>
            </div>
      }
      {
        (showDisclaimer) ? <Disclaimer /> : null
      }
    </>
  );
};

export default GokiButton;
