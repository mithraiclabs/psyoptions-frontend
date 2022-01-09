import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import { useUpdateForm, useFormState } from '../../../context/SimpleUIContext';
import ChooseStrikeButton from './ChooseStrikeButton';
import { SimpleUIPage } from '../SimpeUIPage';
import { useStrikePricesBasedOnBreakeven } from '../../../hooks/BeginnerUI/useStrikePricesBasedOnBreakeven';
import { BigNumber } from 'bignumber.js';
import { PublicKey } from '@solana/web3.js';

const ChooseStrike = () => {
  const { tokenSymbol, direction, expirationUnixTimestamp, strike } =
    useFormState();
  const updateForm = useUpdateForm();
  const history = useHistory();
  const optionWithAsks = useStrikePricesBasedOnBreakeven();

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction || !expirationUnixTimestamp) {
      history.replace('/simple/choose-asset');
    }

    // If previous form state did exist, we need to load the markets on mount
  }, [tokenSymbol, direction, history, expirationUnixTimestamp]);

  const handleMakeSelection = (
    strike: BigNumber,
    serumMarketAddress: PublicKey,
  ) => {
    updateForm('strike', strike);
    updateForm('serumMarketAddress', serumMarketAddress);

    // TODO: animated transition between pages instead of a timeout
    setTimeout(() => {
      history.push('/simple/order-settings');
    }, 500);
  };

  return (
    <SimpleUIPage title="Strike Price">
      <Box display="flex" flexDirection="row" width="100%">
        {optionWithAsks.length > 1 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
            padding="42.5px 0 42.5px 16px"
          >
            <div
              style={{
                fontWeight: 700,
                color: '#8BEAFF',
                fontSize: 10,
              }}
            >
              Low risk High cost
            </div>
            <div
              style={{
                height: '100%',
                width: 4,
                background: 'linear-gradient(180deg, #51F39C 0%, #E36491 100%)',
                borderRadius: 100,
                margin: '8px 0 8px 0',
              }}
            />
            <div
              style={{
                fontWeight: 700,
                color: '#8BEAFF',
                fontSize: 10,
              }}
            >
              High risk Low cost
            </div>
          </Box>
        )}
        <Box
          width="100%"
          px={2}
          py={1}
          flexDirection="column"
          display="flex"
          justifyContent="center"
        >
          {optionWithAsks.map(
            ({ ask, bid, serumMarketAddress, strike: _strike }) => (
              <Box my={1} key={_strike.toString()}>
                <ChooseStrikeButton
                  ask={ask}
                  bid={bid}
                  disabled={false}
                  onClick={() =>
                    handleMakeSelection(_strike, serumMarketAddress)
                  }
                  selected={strike.eq(_strike)}
                  strike={_strike.toString()}
                />
              </Box>
            ),
          )}
        </Box>
      </Box>
    </SimpleUIPage>
  );
};

export default ChooseStrike;
