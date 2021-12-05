import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ConnectWalletButton } from '@gokiprotocol/walletkit';
import { createLocalStorageStateHook } from 'use-local-storage-state';
import Disclaimer from '../Disclaimer';
import { DISALLOWED_COUNTRIES, useCountry } from '../../hooks/useCountry';
import { Link } from 'react-router-dom';

export const useDisclaimerState = createLocalStorageStateHook('hasAcceptedDisclaimer', false);

const useStyles = makeStyles(() => ({
  gokiButton: {
    zIndex: 1,
  },
  disclaimerButtonContainer: {
    position: 'relative',
    zIndex: 1
  },
  disclaimerButton: {
    bottom: 0,
    cursor: 'pointer',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 99
  }
}));

const GokiButton: React.VFC = () => {
  const countryCode = useCountry();
  const isDisallowed = DISALLOWED_COUNTRIES.includes(countryCode ?? '');

  const styles = useStyles();

  const [hasAcceptedDisclaimer] = useDisclaimerState();
  const [showDisclaimer, setDisclaimerVisible] = useState(false);

  const handleGeoCheck = () => {
    if (hasAcceptedDisclaimer) {
      let element: HTMLElement = document.querySelector('#temp-solution-2m00n') as HTMLElement;
      return element.click();
    }
    setDisclaimerVisible(true);
  };

  if (isDisallowed) {
    return (
      <>
        <Link to='/prohibited-jurisdiction'>Prohibited Jurisdiction</Link>
      </>
    );
  }

  return (
    <>
      <div className={styles.disclaimerButtonContainer}>
        {/* Workarounds re Goki callbacks (coming soon?) */}
        <ConnectWalletButton id='temp-solution-2m00n' />
        <div className={styles.disclaimerButton} onClick={handleGeoCheck}></div>
      </div>
      {
        (showDisclaimer) ? <Disclaimer /> : null
      }
    </>
  );
};

export default GokiButton;
