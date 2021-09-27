import React, { useState, memo, useCallback } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Close from '@material-ui/icons/Close';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles, useTheme } from '@material-ui/core/styles';
import * as Sentry from '@sentry/react';

import DialogFullscreenMobile from '../../DialogFullscreenMobile';
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts';
import useNotifications from '../../../hooks/useNotifications';
import useExerciseOpenPosition from '../../../hooks/useExerciseOpenPosition';
import { OptionMarket, OptionType } from '../../../types';
import TxButton from '../../TxButton';
import { PlusMinusIntegerInput } from '../../PlusMinusIntegerInput';

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: (theme.palette.background as any).lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip);

const ExerciseDialog: React.VFC<{
  open: boolean;
  onClose: () => void;
  positionSize: number;
  uAssetSymbol: string;
  uAssetMintAddress: string;
  qAssetSymbol: string;
  qAssetMintAddress: string;
  optionType: OptionType;
  contractSize: string;
  strike: string;
  expiration: string;
  price: number;
  market: OptionMarket;
}> = ({
  open,
  onClose,
  positionSize,
  uAssetSymbol,
  uAssetMintAddress,
  qAssetSymbol,
  qAssetMintAddress,
  optionType,
  contractSize,
  strike,
  expiration,
  price,
  market,
}) => {
  const [numContractsToExercise, setNumContractsToExercise] =
    useState(positionSize);
  const [loading, setLoading] = useState(false);
  const { ownedTokenAccounts } = useOwnedTokenAccounts();
  const { pushNotification } = useNotifications();
  const theme = useTheme();

  const ownedQAssetKey = ownedTokenAccounts[qAssetMintAddress]?.[0]?.pubKey;
  const ownedUAssetKey = ownedTokenAccounts[uAssetMintAddress]?.[0]?.pubKey;
  const ownedOAssetKey =
    ownedTokenAccounts[market.optionMintKey.toString()]?.[0]?.pubKey;

  const exercise = useExerciseOpenPosition(
    market,
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

  const strikeNumber = parseFloat(strike);
  const exerciseCost =
    strikeNumber * parseFloat(contractSize) * numContractsToExercise;
  const sizeTotalToExercise = parseFloat(contractSize) * numContractsToExercise;
  let exerciseCostString = exerciseCost.toString(10);
  if (exerciseCostString.match(/\..{3,}/)) {
    exerciseCostString = exerciseCost.toFixed(2);
  }

  const priceDiff = price - strikeNumber;
  const priceDiffPercentage =
    (priceDiff / strikeNumber) * (optionType === OptionType.PUT ? -100 : 100);
  const betterOrWorse = priceDiffPercentage > 0;
  const priceDiffHelperText = betterOrWorse
    ? 'In the money'
    : 'Out of the money';

  const exerciseTooltipLabel = `${
    optionType === OptionType.PUT ? 'Sell' : 'Purchase'
  } ${sizeTotalToExercise.toFixed(4)} ${
    uAssetSymbol || 'underlying asset'
  } for ${exerciseCostString} ${qAssetSymbol || 'quote asset'}`;

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
              {`${uAssetSymbol}  |  ${expiration}  |  ${optionType}`}
            </Box>
            <Box pt={1}>Strike: {strike}</Box>
            <Box pt={1}>Contract Size: {contractSize}</Box>
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
                    optionType === OptionType.PUT
                      ? sizeTotalToExercise.toFixed(4)
                      : exerciseCostString
                  } ${
                    optionType === OptionType.PUT
                      ? uAssetSymbol || 'underlying asset'
                      : qAssetSymbol || 'quote asset'
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
