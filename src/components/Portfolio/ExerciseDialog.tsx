import React, { useState, memo, useCallback, useMemo } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Close from '@material-ui/icons/Close';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles, useTheme } from '@material-ui/core/styles';
import * as Sentry from '@sentry/react';

import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts';
import useNotifications from '../../hooks/useNotifications';
import useExerciseOpenPosition from '../../hooks/useExerciseOpenPosition';
import DialogFullscreenMobile from '../DialogFullscreenMobile';
import { PlusMinusIntegerInput } from '../PlusMinusIntegerInput';
import TxButton from '../TxButton';
import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../recoil';
import useOpenPositions from '../../hooks/useOpenPositions';
import { useOptionIsCall } from '../../hooks/useOptionIsCall';
import { useOptionContractSize } from '../../hooks/useOptionContractSize';
import { useNormalizedStrikePriceFromOption } from '../../hooks/useNormalizedStrikePriceFromOption';
import { useTokenByMint } from '../../hooks/useNetworkTokens';
import { usePrices } from '../../context/PricesContext';
import { formatExpirationTimestamp } from '../../utils/format';

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip);

const ExerciseDialog: React.VFC<{
  open: boolean;
  onClose: () => void;
  optionKey: PublicKey;
}> = ({ open, onClose, optionKey }) => {
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const positions = useOpenPositions();
  const [loading, setLoading] = useState(false);
  const { ownedTokenAccounts } = useOwnedTokenAccounts();
  const { pushNotification } = useNotifications();
  const { prices } = usePrices();
  const theme = useTheme();
  const contractSize = useOptionContractSize(optionKey);
  const isCall = useOptionIsCall(optionKey);
  const strike = useNormalizedStrikePriceFromOption(
    optionKey.toString(),
    isCall,
  );
  const optionUnderlyingAsset = useTokenByMint(
    option?.underlyingAssetMint ?? '',
  );
  const optionQuoteAsset = useTokenByMint(option?.quoteAssetMint ?? '');
  const optionUnderlyingAssetSymbol =
    optionUnderlyingAsset?.symbol ??
    option?.underlyingAssetMint.toString() ??
    '';
  const ownedQAssetKey =
    ownedTokenAccounts[option?.quoteAssetMint.toString() ?? '']?.[0]?.pubKey;
  const ownedUAssetKey =
    ownedTokenAccounts[option?.underlyingAssetMint.toString() ?? '']?.[0]
      ?.pubKey;
  const ownedOAssetKey =
    ownedTokenAccounts[option?.optionMint.toString() ?? '']?.[0]?.pubKey;
  const positionSize = useMemo(
    () =>
      ownedOAssetKey
        ? positions[optionKey.toString()].find((tokenAccount) =>
            tokenAccount.pubKey.equals(ownedOAssetKey),
          )?.amount ?? 0
        : 0,
    [optionKey, ownedOAssetKey, positions],
  );
  const [_numContractsToExercise, setNumContractsToExercise] = useState<
    number | null
  >(positionSize);
  const numContractsToExercise = _numContractsToExercise ?? 0;
  const optionQuoteAssetSymbol =
    optionQuoteAsset?.symbol ?? option?.quoteAssetMint.toString() ?? '';
  const underlyingAssetSymbol = isCall
    ? optionUnderlyingAssetSymbol
    : optionQuoteAssetSymbol;
  const quoteAssetSymbol = isCall
    ? optionQuoteAssetSymbol
    : optionUnderlyingAssetSymbol;
  const price = prices[underlyingAssetSymbol];

  const exercise = useExerciseOpenPosition(
    optionKey,
    ownedQAssetKey,
    ownedUAssetKey,
    ownedOAssetKey,
  );

  const handleExercisePosition = useCallback(
    async (size) => {
      try {
        setLoading(true);
        await exercise(size);
        setLoading(false);
      } catch (err) {
        Sentry.captureException(err);
        pushNotification({
          severity: 'error',
          message: `${err}`,
        });
        setLoading(false);
      }
    },
    [exercise, pushNotification],
  );

  // within allowable range of 1 and currently available
  const withinRange =
    numContractsToExercise >= 1 && numContractsToExercise <= positionSize;

  const strikeNumber = strike.toNumber();
  const exerciseCost =
    strikeNumber * contractSize.toNumber() * numContractsToExercise;
  const sizeTotalToExercise = contractSize.toNumber() * numContractsToExercise;
  let exerciseCostString = exerciseCost.toString(10);
  if (exerciseCostString.match(/\..{3,}/)) {
    exerciseCostString = exerciseCost.toFixed(2);
  }

  const priceDiff = price - strikeNumber;
  const priceDiffPercentage =
    (priceDiff / strikeNumber) * (!isCall ? -100 : 100);
  const betterOrWorse = priceDiffPercentage > 0;
  const priceDiffHelperText = betterOrWorse
    ? 'In the money'
    : 'Out of the money';

  const exerciseTooltipLabel = `${
    !isCall ? 'Sell' : 'Purchase'
  } ${sizeTotalToExercise.toFixed(4)} ${
    underlyingAssetSymbol || 'underlying asset'
  } for ${exerciseCostString} ${quoteAssetSymbol || 'quote asset'}`;

  const exerciseTooltipJsx = (
    <Box p={1} textAlign="center">
      <Box pb={1} style={{ fontWeight: 700, fontSize: '16px' }}>
        {exerciseTooltipLabel}
      </Box>
      <Box style={{ fontSize: '13px' }}>
        (
        <span
          style={{
            color: betterOrWorse
              ? theme.palette.success.light
              : theme.palette.error.light,
          }}
        >{`${priceDiffPercentage.toFixed(2)}%`}</span>{' '}
        {priceDiffHelperText})
      </Box>
    </Box>
  );

  return (
    <DialogFullscreenMobile open={open} onClose={onClose} maxWidth={'lg'}>
      <Box py={1} px={2} width={['100%', '100%', '680px']} maxWidth={['100%']}>
        <Box
          p={1}
          pr={0}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <h2 style={{ margin: '0' }}>Exercise Position</h2>
          <Button onClick={onClose} style={{ minWidth: '40px' }}>
            <Close />
          </Button>
        </Box>
        <Box flexDirection={['column', 'column', 'row']} display="flex" pb={1}>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box pb={1} pt={2}>
              {`${underlyingAssetSymbol}  |  ${formatExpirationTimestamp(
                option?.expirationUnixTimestamp.toNumber() ?? 0,
              )}  |  ${isCall ? 'Call' : 'Put'}`}
            </Box>
            <Box pt={1}>Strike: {strike.toString()}</Box>
            <Box pt={1}>Contract Size: {contractSize.toString()}</Box>
            <Box pt={1}>Available to exercise: {positionSize}</Box>
          </Box>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box pb={1} pt={2}>
              Exercise Quantity:
              <PlusMinusIntegerInput
                onChange={setNumContractsToExercise}
                value={numContractsToExercise}
              />
              <Box
                display="flex"
                justifyContent="space-between"
                style={{ fontSize: '12px' }}
              >
                <Box pt={2}>
                  {`Collateral req to exercise:  ${
                    !isCall
                      ? sizeTotalToExercise.toFixed(4)
                      : exerciseCostString
                  } ${
                    !isCall
                      ? underlyingAssetSymbol || 'underlying asset'
                      : quoteAssetSymbol || 'quote asset'
                  }`}
                </Box>
                <Box pt={1}>
                  <Button
                    size="small"
                    onClick={() => setNumContractsToExercise(positionSize)}
                  >
                    Max
                  </Button>
                </Box>
              </Box>
            </Box>
            <StyledTooltip title={exerciseTooltipJsx}>
              <Box pt={1}>
                <TxButton
                  fullWidth
                  disabled={!withinRange}
                  variant="outlined"
                  color="primary"
                  onClick={() => handleExercisePosition(numContractsToExercise)}
                  loading={loading}
                >
                  {loading ? 'Exercising' : 'Exercise'} {numContractsToExercise}{' '}
                  Contracts
                </TxButton>
              </Box>
            </StyledTooltip>
            {!withinRange && (
              <Box pt={1} style={{ fontSize: '12px' }}>
                <span style={{ color: theme.palette.error.light }}>
                  Quantity out of bounds
                </span>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </DialogFullscreenMobile>
  );
};

export default memo(ExerciseDialog);
