import React, { useCallback, useState } from 'react';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import Tooltip from '@material-ui/core/Tooltip';
import Avatar from '@material-ui/core/Avatar';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import { makeStyles, withStyles, useTheme } from '@material-ui/core/styles';
import * as Sentry from '@sentry/react';
import BigNumber from 'bignumber.js';

import useExerciseOpenPosition from '../../../hooks/useExerciseOpenPosition';
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts';
import useNotifications from '../../../hooks/useNotifications';
import useAssetList from '../../../hooks/useAssetList';
import { formatExpirationTimestamp } from '../../../utils/format';
import { OptionMarket, OptionType, TokenAccount } from '../../../types';
import TxButton from '../../TxButton';
import { usePrices } from '../../../context/PricesContext';
import { useTradeHistory } from '../../../hooks/PsyOptionsAPI/useTradeHistory';
import type { TradeInfo } from '../../../context/TradeHistoryContext';

const useStyles = makeStyles({
  dropdownOpen: {
    transform: 'rotate(-180deg)',
  },
  dropdownClosed: {
    transform: 'rotate(0)',
  },
});

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: (theme.palette.background as any).lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip);

const PositionRow: React.VFC<{
  row: {
    accounts: TokenAccount[];
    assetPair: string;
    expiration: number;
    market: OptionMarket;
    size: number;
    strikePrice: string;
    qAssetSymbol: string;
    qAssetMintAddress: string;
    uAssetSymbol: string;
    uAssetMintAddress: string;
    amountPerContract: BigNumber;
    quoteAmountPerContract: BigNumber;
  };
}> = ({ row }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const { supportedAssets } = useAssetList();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();
  const { pushNotification } = useNotifications();
  const theme = useTheme();
  const { prices } = usePrices();
  const { buys } = useTradeHistory(row.market?.serumMarketKey);

  // Market price of the option, we should get this from serum
  const currentMarketPrice = 100;
  const positionSize = row.size;

  console.log(buys);

  // TODO memoize this:
  let sizeCounted = 0;
  let priceSum = 0;
  for (let i = 0; i < buys.length; i += 1) {
    const fill = buys[i] as TradeInfo;
    if (sizeCounted + fill.size <= positionSize) {
      sizeCounted += fill.size;
      priceSum += fill.price * fill.size + fill.feeCost;
    } else {
      const sizeMissing = sizeCounted - positionSize;
      if (sizeMissing > 0) {
        sizeCounted += sizeMissing;
        priceSum +=
          fill.price * sizeMissing + fill.feeCost * (sizeMissing / fill.size);
      }
      break;
    }
  }
  const avgBuyPrice = sizeCounted === 0 ? 0 : priceSum / sizeCounted;

  const nowInSeconds = Date.now() / 1000;
  const expired = row.expiration <= nowInSeconds;

  const unrealizedPnL = expired
    ? -priceSum
    : currentMarketPrice * sizeCounted - priceSum;

  let optionType: OptionType;
  if (row?.uAssetSymbol) {
    optionType = row?.uAssetSymbol?.match(/^USD/)
      ? OptionType.PUT
      : OptionType.CALL;
  }

  const price =
    optionType === OptionType.CALL
      ? prices[row?.uAssetSymbol]
      : prices[row?.qAssetSymbol];

  const strike =
    optionType === OptionType.PUT
      ? row.amountPerContract.dividedBy(row.quoteAmountPerContract).toString()
      : row.market.strike.toString(10);

  const contractSize =
    optionType === OptionType.CALL
      ? row.amountPerContract.toString()
      : row.quoteAmountPerContract.toString();

  const onRowClick = () => {
    if (row.accounts.length > 1) {
      setVisible((vis) => !vis);
    }
  };

  const ownedQAssetKey = ownedTokenAccounts[row.qAssetMintAddress]?.[0]?.pubKey;
  const ownedUAssetKey = ownedTokenAccounts[row.uAssetMintAddress]?.[0]?.pubKey;
  const ownedOAssetKey =
    ownedTokenAccounts[row.market.optionMintKey.toString()]?.[0]?.pubKey;

  const { exercise } = useExerciseOpenPosition(
    row.market,
    // TODO remove `toString` when useExerciseOpenPosition is refactored
    ownedQAssetKey && ownedQAssetKey,
    ownedUAssetKey && ownedUAssetKey,
    ownedOAssetKey && ownedOAssetKey,
  );

  const handleExercisePosition = useCallback(async () => {
    try {
      setLoading(true);
      await exercise();
      setLoading(false);
    } catch (err) {
      Sentry.captureException(err);
      pushNotification({
        severity: 'error',
        message: `${err}`,
      });
      setLoading(false);
    }
  }, [exercise, pushNotification]);

  const uAssetSymbol =
    optionType === 'put' ? row?.qAssetSymbol : row?.uAssetSymbol;

  const uAssetImage = supportedAssets.find(
    (asset) =>
      asset?.mintAddress ===
      (optionType === 'put' ? row?.qAssetMintAddress : row?.uAssetMintAddress),
  )?.icon;

  const strikeNumber = parseFloat(strike);
  const exerciseCost = strikeNumber * parseFloat(contractSize);
  let exerciseCostString = exerciseCost.toString(10);
  if (exerciseCostString.match(/\..{3,}/)) {
    exerciseCostString = exerciseCost.toFixed(2);
  }

  const priceDiff = price - strikeNumber;
  const priceDiffPercentage =
    (priceDiff / strikeNumber) * (optionType === 'put' ? -100 : 100);
  const betterOrWorse = priceDiffPercentage > 0;
  const priceDiffHelperText = `${
    betterOrWorse ? 'better' : 'worse'
  } than spot market`;

  const exerciseTooltipLabel = `${
    optionType === 'put' ? 'Sell' : 'Purchase'
  } ${contractSize} ${
    (optionType === 'put' ? row?.qAssetSymbol : row?.uAssetSymbol) ||
    'underlying asset'
  } for ${exerciseCostString} ${
    (optionType === 'put' ? row?.uAssetSymbol : row?.qAssetSymbol) ||
    'quote asset'
  }`;

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
    <>
      <Box
        onClick={onRowClick}
        role="checkbox"
        tabIndex={-1}
        key={row.market.optionMintKey.toString()}
        display="flex"
        flexDirection="row"
        alignItems="center"
        p={1}
      >
        <Box
          p={1}
          pl={2}
          width="12%"
          display="flex"
          flexDirection="row"
          alignItems="center"
        >
          <Avatar style={{ width: 24, height: 24 }} src={uAssetImage}>
            {uAssetSymbol.slice(0, 1)}
          </Avatar>
          <Box pl={1}>{uAssetSymbol}</Box>
        </Box>
        <Box p={1} width="8%">
          {optionType}
        </Box>
        <Box p={1} width="10%">
          {strike}
        </Box>
        <Box p={1} width="10%">
          {price ? `$${price.toFixed(2)}` : '-'}
        </Box>
        <Box p={1} width="10%">
          {contractSize}
        </Box>
        <Box p={1} width="10%">
          {positionSize}
          <Box py={1} fontSize={'12px'}>
            {/* Fills:
            <Box>
              {buys.map((fill) => (
                <Box key={fill.orderId}>
                  price: {fill.price}
                  <br />
                  size: {fill.size}
                  <br />
                </Box>
              ))}
            </Box> */}
            <Box py={1} fontSize={'12px'}>
              Avg Cost: {avgBuyPrice}
              <br />
              Market Price: {!expired ? currentMarketPrice : '-'}
              <br />
              Unrealized PnL:{' '}
              {avgBuyPrice !== 0 ? unrealizedPnL.toFixed(2) : '-'}
            </Box>
          </Box>
        </Box>
        <Box p={1} width="16%">
          {formatExpirationTimestamp(row.expiration)}
        </Box>
        <Box p={1} width="9%">{`+$0.00`}</Box>
        <Box p={1} width="10%">
          {expired && <Box color={theme.palette.error.main}>Expired</Box>}
          {!expired && (
            <StyledTooltip title={exerciseTooltipJsx}>
              <Box>
                <TxButton
                  color="primary"
                  variant="outlined"
                  onClick={handleExercisePosition}
                  loading={loading}
                >
                  {loading ? 'Exercising' : 'Exercise'}
                </TxButton>
              </Box>
            </StyledTooltip>
          )}
        </Box>
        <Box width="5%" p={1} pr={2}>
          {row.accounts.length > 1 && (
            <KeyboardArrowDown
              className={
                visible ? classes.dropdownOpen : classes.dropdownClosed
              }
            />
          )}
        </Box>
      </Box>
      <Box key={`${row.market.optionMintKey}Collapsible`}>
        <Collapse in={visible} timeout="auto" unmountOnExit>
          <Box>
            {row.accounts.map((account) => (
              <Box
                key={`${account?.pubKey}`}
                display="flex"
                flexDirection="row"
                alignItems="center"
                p={1}
              >
                <Box p={1} pl={2} width="12%" />
                <Box p={1} width="8%" />
                <Box p={1} width="10%" />
                <Box p={1} width="10%" />
                <Box p={1} width="10%">
                  {contractSize}
                </Box>
                <Box p={1} width="10%">
                  {account.amount}
                </Box>
                <Box p={1} width="16%" />
                <Box p={1} width="9%">{`+$0.00`}</Box>
                <Box p={1} width="10%">
                  {expired && (
                    <Box color={theme.palette.error.main}>Expired</Box>
                  )}
                  {!expired && (
                    <StyledTooltip title={exerciseTooltipJsx}>
                      <Box>
                        <TxButton
                          color="primary"
                          variant="outlined"
                          onClick={handleExercisePosition}
                          loading={loading}
                        >
                          {loading ? 'Exercising' : 'Exercise'}
                        </TxButton>
                      </Box>
                    </StyledTooltip>
                  )}
                </Box>
                <Box width="5%" p={1} pr={2} />
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    </>
  );
};

export default React.memo(PositionRow);
