import React, { useState } from 'react';
import { Box, TableRow, makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import { PublicKey } from '@solana/web3.js';
import { TCell, TMobileCell } from '../StyledComponents/Table/TableStyles';
import TxButton from '../TxButton';
import useScreenSize from '../../hooks/useScreenSize';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../recoil';
import { useOptionIsCall } from '../../hooks/useOptionIsCall';
import { formatOptionExpiration } from '../../utils/format';
import { useOptionAssetSymbols } from '../../hooks/useOptionAssetSymbols';
import { useOptionContractSize } from '../../hooks/useOptionContractSize';
import { useNormalizedStrikePriceFromOption } from '../../hooks/useNormalizedStrikePriceFromOption';
import { useCancelOrder } from '../../hooks/Serum';
import { OpenOrders } from '@project-serum/serum';

const useStyles = makeStyles((theme) => ({
  root: {},
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowWrap: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexFlow: 'wrap',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  successTextColor: {
    color: theme.palette.success.main,
  },
  errorTextColor: {
    color: theme.palette.error.main,
  },
  tabletFont: {
    fontSize: '14px !important',
  },
  mobileFont: {
    fontSize: '10px !important',
  },
}));

type SerumBidOrAsk = {
  side: string;
  price: number;
  size: number;
  openOrdersAddress: PublicKey;
};

/**
 * Display an open order for an option serum market.
 */
export const OrderRow: React.VFC<{
  order: SerumBidOrAsk;
  openOrders: OpenOrders;
  optionKey: PublicKey;
}> = ({ openOrders, optionKey, order }) => {
  const classes = useStyles();
  const option = useRecoilValue(optionsMap(optionKey.toString()));
  const isCall = useOptionIsCall(optionKey);
  const [optionUnderlyingAssetSymbol, optionQuoteAssetSymbol] =
    useOptionAssetSymbols(optionKey);
  const contractSize = useOptionContractSize(optionKey);
  const strikePrice = useNormalizedStrikePriceFromOption(
    optionKey.toString(),
    isCall,
  );
  const [loading, setLoading] = useState(false);
  const { formFactor } = useScreenSize();
  const normalizedUnderlyingSymbol = isCall
    ? optionUnderlyingAssetSymbol
    : optionQuoteAssetSymbol;
  const assetPair = isCall
    ? `${optionUnderlyingAssetSymbol} / ${optionQuoteAssetSymbol}`
    : `${optionQuoteAssetSymbol} / ${optionUnderlyingAssetSymbol}`;
  const type = isCall ? 'Call' : 'Put';
  const _cancelOrder = useCancelOrder(openOrders.market.toString(), optionKey);

  const cancelOrder = async () => {
    setLoading(true);
    await _cancelOrder(order);
    setLoading(false);
  };

  return (
    <TableRow>
      {formFactor === 'desktop' ? (
        <>
          <TCell
            className={
              order?.side === 'buy'
                ? classes.successTextColor
                : classes.errorTextColor
            }
          >
            {order?.side}
          </TCell>
          <TCell>{type}</TCell>
          <TCell>{assetPair}</TCell>
          <TCell>
            {formatOptionExpiration(option?.expirationUnixTimestamp)}
          </TCell>
          <TCell>{strikePrice.toString()}</TCell>
          <TCell>{`${contractSize.toString()} ${normalizedUnderlyingSymbol}`}</TCell>
          <TCell>{order?.size}</TCell>
          <TCell
            className={
              order?.side === 'buy'
                ? classes.successTextColor
                : classes.errorTextColor
            }
          >
            {order?.price}
          </TCell>
          <TCell align="right">
            <TxButton
              variant="outlined"
              color="primary"
              onClick={cancelOrder}
              loading={loading}
            >
              {loading ? 'Canceling' : 'Cancel'}
            </TxButton>
          </TCell>
        </>
      ) : (
        <>
          <TMobileCell
            className={clsx(
              classes.rowWrap,
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            <Box
              pl={formFactor === 'mobile' ? 1 : 2}
              className={classes.column}
            >
              <Box
                className={clsx(
                  classes.uppercase,
                  order?.side === 'buy'
                    ? classes.successTextColor
                    : classes.errorTextColor,
                )}
              >
                {`${order?.side} ${type}`}
              </Box>
              <Box>{assetPair}</Box>
            </Box>
            <Box
              pl={formFactor === 'mobile' ? 1 : 2}
              className={classes.column}
            >
              <Box>{`Strike: ${strikePrice}`}</Box>
              <Box>{`${contractSize} ${normalizedUnderlyingSymbol}`}</Box>
              <Box>{`Qty: ${order?.size}`}</Box>
            </Box>
          </TMobileCell>
          <TMobileCell
            className={clsx(
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            {formatOptionExpiration(option?.expirationUnixTimestamp)}
          </TMobileCell>
          <TMobileCell
            className={clsx(
              order?.side === 'buy'
                ? classes.successTextColor
                : classes.errorTextColor,
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            {order?.price}
          </TMobileCell>
          <TMobileCell
            align="right"
            className={clsx(
              formFactor === 'tablet' && classes.tabletFont,
              formFactor === 'mobile' && classes.mobileFont,
            )}
          >
            <TxButton
              variant="outlined"
              color="primary"
              onClick={cancelOrder}
              loading={loading}
            >
              {loading ? 'Canceling' : 'Cancel'}
            </TxButton>
          </TMobileCell>
        </>
      )}
    </TableRow>
  );
};
