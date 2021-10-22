import React, { useEffect, useState, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Button } from '@material-ui/core';
import moment from 'moment';
import { ConnectWalletButton } from "@gokiprotocol/walletkit";
import { useFormState } from '../../../context/SimpleUIContext';
import { SimpleUIPage } from '../SimpeUIPage';
import OrderDetails from './OrderDetails';
import LabelledText from './LabelledText';
import { useConnectedWallet } from "@saberhq/use-solana";
import useNotifications from '../../../hooks/useNotifications';
import usePlaceBuyOrder from '../../../hooks/usePlaceBuyOrder';
import { getHighestAccount } from '../../../utils/token';
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts';
import useFilteredOptionsChain from '../../../hooks/useFilteredOptionsChain';
import useSerum from '../../../hooks/useSerum';
import { useSerumOrderbooks } from '../../../context/SerumOrderbookContext';
import { useSerumFeeDiscountKey } from '../../../hooks/Serum/useSerumFeeDiscountKey';
import { calculatePriceWithSlippage } from '../../../utils/calculatePriceWithSlippage';
import {
  calculateBreakevenForLimitOrder,
  calculateBreakevenForMarketOrder,
} from '../../../utils/calculateBreakeven';
import useOptionsMarkets from '../../../hooks/useOptionsMarkets';

const ConfirmOrder = () => {
  const history = useHistory();
  const wallet = useConnectedWallet();
  const { pushErrorNotification } = useNotifications();
  const [cost, setCost] = useState(null as number | null);
  const [breakeven, setBreakeven] = useState(null as number | null);
  const {
    tokenSymbol,
    direction,
    expirationUnixTimestamp,
    strike,
    orderSize,
    orderType,
    limitPrice,
    contractSize,
  } = useFormState();
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const { lowestAskHighestBidPerStrike, optionRowForStrike } =
    useFilteredOptionsChain(direction === 'down' ? 'put' : 'call');
  const serumAddress = optionRowForStrike[strike]?.serumMarketKey?.toString();
  const placeBuyOrder = usePlaceBuyOrder(serumAddress);
  const { serumMarkets } = useSerum();
  const [orderbooks] = useSerumOrderbooks();
  const { feeRates: serumFeeRates, publicKey: serumDiscountFeeKey } =
    useSerumFeeDiscountKey();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();
  const { marketsBySerumKey } = useOptionsMarkets();

  const optionMarket = marketsBySerumKey[serumAddress];

  const serumMarketData = serumMarkets[serumAddress];
  const serumMarket = serumMarketData?.serumMarket;
  const orderbook = orderbooks[serumAddress];

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (
      !tokenSymbol ||
      !direction ||
      !expirationUnixTimestamp ||
      !strike ||
      !orderSize ||
      !contractSize ||
      (orderType === 'limit' && !limitPrice)
    ) {
      history.replace('/simple/choose-asset');
    }
  }, [
    tokenSymbol,
    direction,
    expirationUnixTimestamp,
    strike,
    orderSize,
    orderType,
    limitPrice,
    contractSize,
    history,
  ]);

  useEffect(() => {
    if (orderType === 'limit') {
      setCost(limitPrice);
    } else if (lowestAskHighestBidPerStrike[strike.toString(10)]?.ask) {
      setCost(lowestAskHighestBidPerStrike[strike.toString(10)].ask);
    }
  }, [limitPrice, orderType, lowestAskHighestBidPerStrike, strike]);

  useEffect(() => {
    let newBreakevenPrice: number | null = null;
    if (orderType === 'limit') {
      newBreakevenPrice = calculateBreakevenForLimitOrder(
        strike,
        contractSize,
        limitPrice,
        direction === 'down',
      );
    } else if (lowestAskHighestBidPerStrike[strike.toString(10)]?.ask) {
      newBreakevenPrice = calculateBreakevenForMarketOrder(
        strike,
        contractSize,
        orderSize,
        orderbook?.asks ?? [],
        direction === 'down',
      );
    }

    setBreakeven(newBreakevenPrice);
  }, [
    limitPrice,
    orderType,
    lowestAskHighestBidPerStrike,
    strike,
    contractSize,
    orderSize,
    direction,
    orderbook?.asks,
  ]);

  const disabledPlaceOrder = useMemo(() => {
    return !serumMarket || !wallet?.publicKey || (orderType === "limit" && !limitPrice)
  }, [serumMarket, wallet?.publicKey, orderType, limitPrice]);

  const handlePlaceOrderClicked = useCallback(async () => {
    if (disabledPlaceOrder || !wallet?.publicKey) return;

    setPlaceOrderLoading(true);
    try {
      const serumQuoteTokenAccounts =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: serum market._decoded
        ownedTokenAccounts[serumMarket?._decoded?.quoteMint?.toString()] || [];
      const serumQuoteTokenKey = getHighestAccount(
        serumQuoteTokenAccounts,
      )?.pubKey;
      const optionAccounts = ownedTokenAccounts[`${optionRowForStrike[strike]?.optionMintKey}`] || [];
      const optionTokenKey = getHighestAccount(optionAccounts)?.pubKey;

      await placeBuyOrder({
        optionMarket,
        serumMarket: serumMarket,
        optionDestinationKey: optionTokenKey,
        orderArgs: {
          owner: wallet.publicKey,
          // For Serum, the payer is really the account of the asset being sold
          payer: serumQuoteTokenKey || null,
          side: 'buy',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === "limit"
              ? limitPrice!
              : calculatePriceWithSlippage(orderSize, orderbook?.asks),
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          size: orderSize,
          // TODO create true mapping https://github.com/project-serum/serum-ts/blob/6803cb95056eb9b8beced9135d6956583ae5a222/packages/serum/src/market.ts#L1163
          orderType: orderType === 'market' ? 'ioc' : 'limit',
          // This will be null if a token with the symbol SRM does
          // not exist in the supported asset list
          feeDiscountPubkey: serumDiscountFeeKey,
          // serum fee rate. Should use the taker fee even if limit order if it's likely to match an order
          feeRate:
            orderType === 'market' || (limitPrice && limitPrice >= orderbook?.asks?.[0]?.price)
              ? serumFeeRates?.taker
              : undefined,
        },
      });
      setPlaceOrderLoading(false);
    } catch (err) {
      setPlaceOrderLoading(false);
      Sentry.captureException(err);
      pushErrorNotification(err);
    }
  }, [
    disabledPlaceOrder,
    serumMarket,
    ownedTokenAccounts,
    optionRowForStrike,
    strike,
    optionMarket,
    wallet?.publicKey,
    orderType,
    limitPrice,
    orderSize,
    orderbook,
    serumDiscountFeeKey,
    serumFeeRates,
    placeBuyOrder,
    pushErrorNotification,
  ]);

  return (
    <SimpleUIPage title={'Confirm Order'}>
      <Box width="100%" px={2} py={1} flexDirection="column" display="flex">
        <OrderDetails
          side="buy"
          callOrPut={direction === 'up' ? 'call' : 'put'}
          contractSize={contractSize}
          orderSize={orderSize}
        />
        <Box width="100%" py={2} flexDirection="column" display="flex">
          <Box paddingBottom={1}>
            <LabelledText
              title={moment
                .unix(expirationUnixTimestamp)
                .format('MMMM Do YYYY')}
              subtitle="Expiration"
            />
          </Box>
          <Box paddingBottom={1}>
            <LabelledText title={`$${strike.toString()}`} subtitle="Strike" />
          </Box>
          <Box paddingBottom={1}>
            <LabelledText
              title={cost ? `$${cost.toString()}` : '-'}
              subtitle="Cost"
            />
          </Box>
          <Box paddingBottom={1}>
            <LabelledText
              title={breakeven ? `$${breakeven.toString()}` : '-'}
              subtitle="Breakeven"
            />
          </Box>
        </Box>
        <Box
          width="100%"
          py={2}
          flexDirection="column"
          display="flex"
          alignItems="center"
        >
          {!wallet?.connected ? (
            <ConnectWalletButton />
          ) : placeOrderLoading ? (
            <CircularProgress />
          ) : (
            <Button
              color="primary"
              onClick={handlePlaceOrderClicked}
              variant="outlined"
              style={{ width: '100%' }}
              disabled={disabledPlaceOrder}
            >
              {disabledPlaceOrder ?  'Loading Market Info...' : 'Place Order'}
            </Button>
          )}
        </Box>
      </Box>
    </SimpleUIPage>
  );
};

export default ConfirmOrder;
