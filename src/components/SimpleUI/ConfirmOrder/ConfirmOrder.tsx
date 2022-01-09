import React, { useEffect, useState, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import { DISALLOWED_COUNTRIES, useCountry } from '../../../hooks/useCountry';
import { useHistory, Link } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Button } from '@material-ui/core';
import moment from 'moment';
import GokiButton from '../../GokiButton';
import { useFormState } from '../../../context/SimpleUIContext';
import { SimpleUIPage } from '../SimpeUIPage';
import OrderDetails from './OrderDetails';
import LabelledText from './LabelledText';
import { useConnectedWallet } from '@saberhq/use-solana';
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
import { PublicKey } from '@solana/web3.js';
import { useRecoilValue } from 'recoil';
import { optionsMap } from '../../../recoil';

const ConfirmOrder = () => {
  const {
    tokenSymbol,
    direction,
    expirationUnixTimestamp,
    strike,
    orderSize,
    orderType,
    optionKey,
    limitPrice,
    contractSize,
    serumMarketAddress,
  } = useFormState();
  const countryCode = useCountry();
  const option = useRecoilValue(optionsMap(optionKey?.toString() ?? ''));
  const [isProhibited, setIsProhibited] = useState(true);
  const history = useHistory();
  const wallet = useConnectedWallet();
  const { pushErrorNotification } = useNotifications();
  const [cost, setCost] = useState(limitPrice);
  const [breakeven, setBreakeven] = useState(null as number | null);
  const [
    disabledButtonMessage,
    // , setDisabledButtonMessage
  ] = useState(
    isProhibited ? 'Prohibited Jurisdiction' : 'Loading Market Info...',
  );
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const placeBuyOrder = usePlaceBuyOrder(serumMarketAddress?.toString() ?? '');
  const { serumMarkets } = useSerum();
  const [orderbooks] = useSerumOrderbooks();
  const { feeRates: serumFeeRates, publicKey: serumDiscountFeeKey } =
    useSerumFeeDiscountKey();
  const { ownedTokenAccounts } = useOwnedTokenAccounts();

  const serumMarketData = serumMarkets[serumMarketAddress?.toString() ?? ''];
  const serumMarket = serumMarketData?.serumMarket;
  const orderbook = orderbooks[serumMarketAddress?.toString() ?? ''];

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
    if (orderType !== 'limit' && orderbook?.asks[0]?.price) {
      setCost(orderbook?.asks[0]?.price);
    }
  }, [orderType, strike, orderbook?.asks]);

  useEffect(() => {
    let newBreakevenPrice: number | null = null;
    if (orderType === 'limit' && limitPrice) {
      newBreakevenPrice = calculateBreakevenForLimitOrder(
        strike.toNumber(),
        contractSize,
        limitPrice,
        direction === 'down',
      );
    } else if (orderbook?.asks[0]?.price) {
      newBreakevenPrice = calculateBreakevenForMarketOrder(
        strike.toNumber(),
        contractSize,
        orderSize,
        orderbook?.asks ?? [],
        direction === 'down',
      );
    }
    if (newBreakevenPrice) {
      setBreakeven(newBreakevenPrice);
    }
  }, [
    limitPrice,
    orderType,
    strike,
    contractSize,
    orderSize,
    direction,
    orderbook?.asks,
  ]);

  useEffect(() => {
    setIsProhibited(DISALLOWED_COUNTRIES.includes(countryCode ?? ''));
  }, [countryCode]);

  const disabledPlaceOrder = useMemo(() => {
    return (
      isProhibited ||
      !serumMarket ||
      !wallet?.publicKey ||
      (orderType === 'limit' && !limitPrice) ||
      !orderbook?.asks?.length
    );
  }, [
    isProhibited,
    serumMarket,
    wallet?.publicKey,
    orderType,
    limitPrice,
    orderbook?.asks,
  ]);

  const handlePlaceOrderClicked = useCallback(async () => {
    if (disabledPlaceOrder || !wallet || !serumMarket || !option) {
      return;
    }

    setPlaceOrderLoading(true);
    try {
      const serumQuoteTokenAccounts =
        // @ts-ignore: serum market._decoded
        ownedTokenAccounts[serumMarket?._decoded?.quoteMint?.toString()] || [];
      const serumQuoteTokenKey = getHighestAccount(
        serumQuoteTokenAccounts,
      )?.pubKey;
      const optionAccounts =
        ownedTokenAccounts[option.optionMint.toString()] || [];
      const optionTokenKey = getHighestAccount(optionAccounts)?.pubKey;

      await placeBuyOrder({
        option,
        serumMarket: serumMarket,
        optionDestinationKey: optionTokenKey,
        orderArgs: {
          owner: wallet.publicKey,
          // For Serum, the payer is really the account of the asset being sold
          payer: serumQuoteTokenKey as PublicKey,
          side: 'buy',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === 'limit'
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
            orderType === 'market' ||
            (limitPrice && limitPrice >= orderbook?.asks?.[0]?.price)
              ? (serumFeeRates?.taker ?? 0) * 2
              : undefined,
        },
      });
      setPlaceOrderLoading(false);
      history.push('/portfolio');
    } catch (err) {
      setPlaceOrderLoading(false);
      Sentry.captureException(err);
      pushErrorNotification(err);
    }
  }, [
    disabledPlaceOrder,
    wallet,
    serumMarket,
    ownedTokenAccounts,
    placeBuyOrder,
    option,
    orderType,
    limitPrice,
    orderSize,
    orderbook?.asks,
    serumDiscountFeeKey,
    serumFeeRates?.taker,
    history,
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
              title={
                orderType === 'market'
                  ? 'Market Price'
                  : cost
                  ? `$${cost.toString()}`
                  : '-'
              }
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
            <GokiButton />
          ) : placeOrderLoading ? (
            <CircularProgress />
          ) : (
            <>
              <Button
                color="primary"
                onClick={handlePlaceOrderClicked}
                variant="outlined"
                style={{ width: '100%' }}
                disabled={disabledPlaceOrder}
              >
                {disabledPlaceOrder
                  ? !orderbook?.asks?.length
                    ? 'No Offers'
                    : disabledButtonMessage
                  : 'Place Order'}
              </Button>
              {isProhibited ? (
                <div style={{ marginTop: '15px' }}>
                  <span>⚠️</span>
                  <span
                    style={{
                      color: 'white',
                      marginRight: '10px',
                      marginLeft: '15px',
                    }}
                  >
                    It appears you're located in a prohibited jurisdiction.
                  </span>
                  <Link to="/prohibited-jurisdiction">
                    Click here for more information
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </Box>
      </Box>
    </SimpleUIPage>
  );
};

export default ConfirmOrder;
