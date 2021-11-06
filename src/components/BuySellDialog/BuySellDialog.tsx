/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, memo, useCallback, useEffect, useMemo } from 'react';
import Close from '@material-ui/icons/Close';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Done from '@material-ui/icons/Done';
import * as Sentry from '@sentry/react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import type { Moment } from 'moment';

import theme from '../../utils/theme';
import { WRAPPED_SOL_ADDRESS, getHighestAccount } from '../../utils/token';
import { useConnectedWallet } from '@saberhq/use-solana';
import useSerum from '../../hooks/useSerum';
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts';
import useNotifications from '../../hooks/useNotifications';
import usePlaceSellOrder from '../../hooks/usePlaceSellOrder';
import usePlaceBuyOrder from '../../hooks/usePlaceBuyOrder';
import { useSerumOrderbook } from '../../hooks/Serum';
import { useSerumFeeDiscountKey } from '../../hooks/Serum/useSerumFeeDiscountKey';
import { useOptionMarket } from '../../hooks/useOptionMarket';

import OrderBook from '../OrderBook';
import { UnsettledFunds } from './UnsettledFunds';
import BuyButton from './BuyButton';
import SellButton from './SellButton';
import { StyledFilledInput } from './styles';
import GokiButton from '../GokiButton';

import DialogFullscreenMobile from '../DialogFullscreenMobile';
import { calculatePriceWithSlippage } from '../../utils/calculatePriceWithSlippage';
import {
  calculateBreakevenForLimitOrder,
  calculateBreakevenForMarketOrder,
} from '../../utils/calculateBreakeven';
import { useInitializeSerumMarket } from '../../hooks/Serum/useInitializeSerumMarket';
import { PlusMinusIntegerInput } from '../PlusMinusIntegerInput';
import { TokenAccount } from '../../types';
import useWalletInfo from '../../hooks/useWalletInfo';

const bgLighterColor = (theme.palette.background as any).lighter;

const orderTypes = ['limit', 'market'];

const zero = new BigNumber(0);

// TODO fix all the things

const BuySellDialog: React.VFC<{
  open: boolean;
  onClose: () => void;
  heading: string;
  amountPerContract: BigNumber;
  quoteAmountPerContract: BigNumber;
  uAssetSymbol: string;
  qAssetSymbol: string;
  qAssetMint: string;
  uAssetMint: string;
  uAssetDecimals: number;
  qAssetDecimals: number;
  strike: BigNumber;
  round: boolean;
  precision: number;
  type: string;
  optionMintKey: PublicKey;
  writerTokenMintKey: PublicKey;
  serumAddress: string;
  date: Moment;
  markPrice: number;
  setLimitPrice: React.Dispatch<React.SetStateAction<string>>;
  limitPrice: string;
}> = ({
  open,
  onClose,
  heading,
  amountPerContract = zero,
  quoteAmountPerContract = zero,
  uAssetSymbol,
  qAssetSymbol,
  qAssetMint,
  uAssetMint,
  uAssetDecimals,
  qAssetDecimals,
  strike,
  round,
  precision,
  type,
  optionMintKey,
  writerTokenMintKey,
  serumAddress,
  date,
  markPrice,
  setLimitPrice,
  limitPrice,
}) => {
  const [orderType, setOrderType] = useState('limit');
  const [orderSize, setOrderSize] = useState(1);
  const [optionAccounts, setOptionAccounts] = useState([] as TokenAccount[]);
  const [writerAccounts, setWriterAccounts] = useState([] as TokenAccount[]);
  const [uAssetAccounts, setUAssetAccounts] = useState([] as TokenAccount[]);
  const [contractsWritten, setContractsWritten] = useState(0);
  const [openPositionSize, setOpenPositionSize] = useState(0);
  const [qAssetBalance, setQAssetBalance] = useState(0);
  const [uAssetBalance, setUAssetBalance] = useState(0);
  const [initializingSerum, setInitializingSerum] = useState(false);
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { balance } = useWalletInfo();
  const placeSellOrder = usePlaceSellOrder(serumAddress);
  const placeBuyOrder = usePlaceBuyOrder(serumAddress);
  const { serumMarkets, fetchSerumMarket } = useSerum();
  const { orderbook } = useSerumOrderbook(serumAddress);
  const initializeSerumMarket = useInitializeSerumMarket();
  const { feeRates: serumFeeRates, publicKey: serumDiscountFeeKey } =
    useSerumFeeDiscountKey();
  const { ownedTokenAccounts, loadingOwnedTokenAccounts } =
    useOwnedTokenAccounts();
  const optionMarket = useOptionMarket({
    date: date.unix(),
    uAssetSymbol,
    qAssetSymbol,
    size: amountPerContract.toString(),
    amountPerContract,
    quoteAmountPerContract,
  });

  const serumMarketData = useMemo(() => {
    return serumMarkets[serumAddress];
  }, [serumMarkets, serumAddress]);

  const parsedLimitPrice = useMemo(() => {
    return new BigNumber(
      Number.isNaN(parseFloat(limitPrice)) || parseFloat(limitPrice) < 0
        ? 0
        : parseFloat(limitPrice),
    );
  }, [limitPrice]);

  const collateralRequired = useMemo(() => {
    return amountPerContract
      ? Math.max(
          amountPerContract.multipliedBy(orderSize).toNumber() -
            openPositionSize * amountPerContract.toNumber(),
          0,
        )
      : 'N/A';
  }, [amountPerContract, orderSize, openPositionSize]);

  useEffect(() => {
    const newOptionAccounts = ownedTokenAccounts[`${optionMintKey}`] || [];
    const newWriterAccounts = ownedTokenAccounts[`${writerTokenMintKey}`] || [];
    const newUAssetAccounts = ownedTokenAccounts[uAssetMint] || [];
    const newQAssetAccounts = ownedTokenAccounts[qAssetMint] || [];
    setOptionAccounts(newOptionAccounts);
    setWriterAccounts(newWriterAccounts);
    setUAssetAccounts(newUAssetAccounts);

    setOpenPositionSize(getHighestAccount(newOptionAccounts)?.amount || 0);
    setContractsWritten(getHighestAccount(newWriterAccounts)?.amount || 0);

    setQAssetBalance(
      (getHighestAccount(newQAssetAccounts)?.amount || 0) /
        10 ** qAssetDecimals,
    );
    let tempBalance =
      (getHighestAccount(newUAssetAccounts)?.amount || 0) /
      10 ** uAssetDecimals;
    if (uAssetMint === WRAPPED_SOL_ADDRESS) {
      // if asset is wrapped Sol, use balance of wallet account
      tempBalance = balance ?? 0 / LAMPORTS_PER_SOL;
    }
    setUAssetBalance(tempBalance);
  }, [
    ownedTokenAccounts,
    optionMintKey,
    writerTokenMintKey,
    uAssetMint,
    qAssetMint,
    qAssetDecimals,
    uAssetDecimals,
    balance,
  ]);

  const formatStrike = (sp: BigNumber) => {
    if (!sp) return '—';
    return round ? sp.toFixed(precision) : sp.toString(10);
  };

  const handleInitializeSerum = useCallback(async () => {
    const serumProgramKey = optionMarket?.serumProgramId
      ? new PublicKey(optionMarket.serumProgramId)
      : null;
    if (!optionMarket || !serumProgramKey) return;

    setInitializingSerum(true);

    try {
      // TODO: make tick size and quote lot size configurable... maybe?
      // Or should we just have sane defaults?
      let tickSize = 0.0001;
      if (
        (type === 'call' && qAssetSymbol.match(/^USD/)) ||
        (type === 'put' && uAssetSymbol.match(/^USD/))
      ) {
        tickSize = 0.01;
      }

      // This will likely be USDC or USDT but could be other things in some cases
      const quoteLotSize = new BN(
        tickSize * 10 ** (type === 'call' ? qAssetDecimals : uAssetDecimals),
      );

      const serumMarketInfo = await initializeSerumMarket({
        optionMarketKey: optionMarket.pubkey,
        baseMintKey: optionMintKey,
        quoteMintKey:
          type === 'call'
            ? new PublicKey(qAssetMint)
            : new PublicKey(uAssetMint),
        quoteLotSize,
      });

      // Load the market instance into serum context state
      // There may be a more efficient way to do this part since we have the keypair here
      // Open to suggestions / refactoring
      if (serumMarketInfo) {
        await fetchSerumMarket(
          serumMarketInfo[0],
          new PublicKey(uAssetMint),
          new PublicKey(qAssetMint),
          serumProgramKey,
        );
      }
    } catch (error) {
      pushErrorNotification(error);
    } finally {
      setInitializingSerum(false);
    }
  }, [
    optionMarket,
    qAssetSymbol,
    uAssetSymbol,
    type,
    qAssetDecimals,
    uAssetDecimals,
    initializeSerumMarket,
    optionMintKey,
    fetchSerumMarket,
    pushErrorNotification,
    uAssetMint,
    qAssetMint,
  ]);

  const handlePlaceSellOrder = useCallback(async () => {
    if (
      !serumMarketData ||
      !serumMarketData?.serumMarket ||
      !wallet?.publicKey ||
      !optionMarket ||
      !orderbook
    )
      return;
    setPlaceOrderLoading(true);
    try {
      const numberOfContracts = orderSize - openPositionSize;
      const optionTokenKey = getHighestAccount(optionAccounts)?.pubKey;
      const underlyingAssetSrcKey = getHighestAccount(uAssetAccounts)?.pubKey;
      const writerTokenDestinationKey =
        getHighestAccount(writerAccounts)?.pubKey;

      await placeSellOrder({
        numberOfContractsToMint: numberOfContracts,
        serumMarket: serumMarketData.serumMarket,
        orderArgs: {
          owner: wallet.publicKey,
          // For Serum, the payer is really the account of the asset being sold
          payer: optionTokenKey,
          side: 'sell',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === 'market'
              ? calculatePriceWithSlippage(orderSize, orderbook.bids)
              : parsedLimitPrice.toNumber(),
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          size: orderSize,
          // TODO create true mapping https://github.com/project-serum/serum-ts/blob/6803cb95056eb9b8beced9135d6956583ae5a222/packages/serum/src/market.ts#L1163
          orderType: orderType === 'market' ? 'ioc' : 'limit',
          // This will be null if a token with the symbol SRM does
          // not exist in the supported asset list
          feeDiscountPubkey: serumDiscountFeeKey,
          // serum fee rate. Should use the taker fee even if limit order if it's likely to match an order
          feeRate: undefined,
        },
        uAsset: {
          tokenSymbol: uAssetSymbol,
          mintAddress: uAssetMint,
          decimals: uAssetDecimals,
        },
        optionMarket,
        uAssetTokenAccount: underlyingAssetSrcKey
          ? {
              pubKey: underlyingAssetSrcKey,
              amount:
                uAssetAccounts.find((asset) =>
                  asset.pubKey.equals(underlyingAssetSrcKey),
                )?.amount || 0,
              mint: new PublicKey(uAssetMint),
            }
          : null,
        mintedOptionDestinationKey: optionTokenKey,
        writerTokenDestinationKey,
      });
      setPlaceOrderLoading(false);
    } catch (err) {
      setPlaceOrderLoading(false);
      Sentry.captureException(err);
      pushErrorNotification(err);
    }
  }, [
    orderSize,
    orderbook,
    orderType,
    openPositionSize,
    optionAccounts,
    uAssetAccounts,
    writerAccounts,
    placeSellOrder,
    serumMarketData,
    wallet?.publicKey,
    parsedLimitPrice,
    serumDiscountFeeKey,
    uAssetSymbol,
    uAssetMint,
    uAssetDecimals,
    optionMarket,
    pushErrorNotification,
  ]);

  const handleBuyOrder = useCallback(async () => {
    if (
      !serumMarketData ||
      !serumMarketData?.serumMarket ||
      !wallet?.publicKey ||
      !optionMarket ||
      !orderbook
    )
      return;

    setPlaceOrderLoading(true);

    try {
      const serumQuoteTokenAccounts =
        // @ts-ignore: serum market._decoded
        ownedTokenAccounts[
          serumMarketData.serumMarket._decoded.quoteMint.toString()
        ] || [];
      const serumQuoteTokenKey = getHighestAccount(
        serumQuoteTokenAccounts,
      )?.pubKey;
      const optionTokenKey = getHighestAccount(optionAccounts)?.pubKey;
      await placeBuyOrder({
        optionMarket,
        serumMarket: serumMarketData?.serumMarket,
        optionDestinationKey: optionTokenKey,
        orderArgs: {
          owner: wallet.publicKey,
          // For Serum, the payer is really the account of the asset being sold
          payer: serumQuoteTokenKey,
          side: 'buy',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === 'market'
              ? calculatePriceWithSlippage(orderSize, orderbook?.asks)
              : parsedLimitPrice.toNumber(),
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
            parsedLimitPrice.isGreaterThanOrEqualTo(orderbook?.asks?.[0]?.price)
              ? (serumFeeRates?.taker ?? 0) * 2
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
    ownedTokenAccounts,
    orderSize,
    orderbook,
    orderType,
    optionAccounts,
    placeBuyOrder,
    serumMarketData,
    wallet?.publicKey,
    parsedLimitPrice,
    serumDiscountFeeKey,
    serumFeeRates,
    optionMarket,
    pushErrorNotification,
  ]);

  const serumMarketQuoteAssetSymbol =
    type === 'put' ? uAssetSymbol : qAssetSymbol;
  const serumMarketQuoteAssetBalance =
    type === 'put' ? uAssetBalance : qAssetBalance;

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
          <h2 style={{ margin: '0' }}>{heading}</h2>
          <Button onClick={onClose} style={{ minWidth: '40px' }}>
            <Close />
          </Button>
        </Box>
        <Box flexDirection={['column', 'column', 'row']} display="flex" pb={1}>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box pt={1}>
              Strike: {formatStrike(strike)}{' '}
              {type === 'call'
                ? `${qAssetSymbol}/${uAssetSymbol}`
                : `${uAssetSymbol}/${qAssetSymbol}`}
            </Box>
            <Box pt={1}>
              Contract Size:{' '}
              {(type === 'put'
                ? quoteAmountPerContract
                : amountPerContract
              ).toString()}{' '}
              {type === 'put' ? qAssetSymbol : uAssetSymbol}
            </Box>
            <Box pt={1}>Mark Price: {markPrice ?? '-'}</Box>
            <Box pt={1}>
              Open Position:{' '}
              {loadingOwnedTokenAccounts ? 'Loading...' : openPositionSize}
            </Box>
            <Box py={1}>
              Written:{' '}
              {loadingOwnedTokenAccounts ? (
                'Loading...'
              ) : (
                <>
                  {contractsWritten}{' '}
                  <span style={{ opacity: 0.5 }}>
                    ({contractsWritten * amountPerContract.toNumber()}{' '}
                    {uAssetSymbol} locked)
                  </span>
                </>
              )}
            </Box>
            <Box pb={1} pt={2}>
              Order Quantity:
              <PlusMinusIntegerInput
                onChange={setOrderSize}
                value={orderSize}
              />
              <Box pt={1} style={{ fontSize: '12px' }}>
                Collateral req to sell:{' '}
                {loadingOwnedTokenAccounts
                  ? 'Loading...'
                  : `${collateralRequired} ${uAssetSymbol}`}
              </Box>
            </Box>
            <Box pb={1} pt={2}>
              Order Type:
              <Box pt={1}>
                {orderTypes.map((_type) => {
                  const selected = _type === orderType;
                  return (
                    <Chip
                      key={_type}
                      clickable
                      size="small"
                      label={_type}
                      color="primary"
                      onClick={() => setOrderType(_type)}
                      onDelete={
                        selected ? () => setOrderType(_type) : undefined
                      }
                      variant={selected ? undefined : 'outlined'}
                      deleteIcon={selected ? <Done /> : undefined}
                      style={{
                        marginRight: theme.spacing(2),
                        minWidth: '98px',
                        fontSize: '14px',
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
            <Box
              pb={1}
              pt={2}
              color={
                orderType === 'market'
                  ? (theme.palette.background as any).lighter
                  : theme.palette.primary.main
              }
            >
              Limit Price ({serumMarketQuoteAssetSymbol}):
              <Box pt={1}>
                <StyledFilledInput
                  type="number"
                  value={orderType === 'market' ? '' : `${limitPrice}`}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  onBlur={() => {
                    setLimitPrice(parsedLimitPrice.toString());
                  }}
                  disabled={orderType === 'market'}
                />
              </Box>
            </Box>
            <Box pt={2} style={{ fontSize: '12px' }}>
              Balances:{' '}
            </Box>
            <Box
              display="flex"
              justifyContent="space-between"
              style={{ fontSize: '12px' }}
            >
              <Box pt={1}>
                {loadingOwnedTokenAccounts
                  ? 'Loading...'
                  : `${uAssetSymbol}: ${uAssetBalance} `}
              </Box>
              <Box pt={1}>
                {loadingOwnedTokenAccounts
                  ? 'Loading...'
                  : `${qAssetSymbol}: ${qAssetBalance} `}
              </Box>
            </Box>
          </Box>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent={
                serumMarketData?.serumMarket && !serumMarketData?.error
                  ? 'flex-start'
                  : 'center'
              }
              alignItems="center"
              width="100%"
              height="100%"
              pb={3}
            >
              {serumMarketData?.loading ? (
                <CircularProgress />
              ) : serumMarketData?.serumMarket && !serumMarketData?.error ? (
                <>
                  <OrderBook
                    setOrderSize={setOrderSize}
                    setLimitPrice={setLimitPrice}
                    {...orderbook}
                  />
                  <Box
                    pt={3}
                    pb={1}
                    display="flex"
                    flexDirection="row"
                    justifyContent="center"
                    width="100%"
                  >
                    {!wallet?.connected ? (
                      <GokiButton />
                    ) : placeOrderLoading ? (
                      <CircularProgress />
                    ) : (
                      <>
                        <Box pr={1} width="50%">
                          <BuyButton
                            parsedLimitPrice={parsedLimitPrice}
                            numberOfAsks={orderbook?.asks?.length || 0}
                            qAssetSymbol={serumMarketQuoteAssetSymbol}
                            orderType={orderType}
                            orderCost={parsedLimitPrice.multipliedBy(orderSize)}
                            parsedOrderSize={orderSize}
                            qAssetBalance={serumMarketQuoteAssetBalance}
                            onClick={handleBuyOrder}
                          />
                        </Box>
                        <Box pl={1} width="50%">
                          <SellButton
                            amountPerContract={amountPerContract}
                            parsedLimitPrice={parsedLimitPrice}
                            openPositionSize={openPositionSize}
                            numberOfBids={orderbook?.bids?.length || 0}
                            uAssetSymbol={uAssetSymbol}
                            uAssetBalance={uAssetBalance}
                            orderType={orderType}
                            parsedOrderSize={orderSize}
                            onClick={handlePlaceSellOrder}
                          />
                        </Box>
                      </>
                    )}
                  </Box>
                  <Box alignSelf="flex-start" pt={1} pb={2}>
                    {orderType === 'limit' &&
                    parsedLimitPrice.isLessThanOrEqualTo(0)
                      ? `Invalid Limit Price: ${parsedLimitPrice}`
                      : `${orderSize} ${type}${orderSize > 1 ? 's' : ''} @ ${
                          orderType === 'limit'
                            ? `${parsedLimitPrice} ${
                                type === 'call' ? qAssetSymbol : uAssetSymbol
                              } ${orderSize > 1 ? 'each' : ''}`
                            : 'market price'
                        }`}
                  </Box>
                  <Box alignSelf="flex-start" pt={1} pb={2}>
                    Breakeven:{' $'}
                    {orderSize
                      ? orderType === 'market'
                        ? calculateBreakevenForMarketOrder(
                            strike.toNumber(),
                            type === 'call'
                              ? amountPerContract.toNumber()
                              : quoteAmountPerContract.toNumber(),
                            orderSize,
                            orderbook?.asks ?? [],
                            type === 'put',
                          )
                        : calculateBreakevenForLimitOrder(
                            strike.toNumber(),
                            type === 'call'
                              ? amountPerContract.toNumber()
                              : quoteAmountPerContract.toNumber(),
                            parsedLimitPrice.toNumber(),
                            type === 'put',
                          )
                      : '-'}
                  </Box>
                  <Box
                    py={2}
                    borderTop={`1px solid ${bgLighterColor}`}
                    fontSize={'14px'}
                  >
                    {`This is a ${
                      type === 'call' ? 'covered call' : 'secured put'
                    }. Mint/Sell will lock the required collateral (${collateralRequired} ${uAssetSymbol}) until the contract expires or is exercised.`}
                  </Box>
                  <UnsettledFunds
                    qAssetSymbol={type === 'call' ? qAssetSymbol : uAssetSymbol}
                    serumMarketAddress={serumAddress}
                    qAssetDecimals={
                      type === 'call' ? qAssetDecimals : uAssetDecimals
                    }
                  />
                </>
              ) : !wallet?.connected ? (
                <>
                  <Box textAlign="center" px={2} pb={2}>
                    Connect to Initialize Serum Market
                  </Box>
                  <GokiButton />
                </>
              ) : (
                <>
                  <Box textAlign="center" px={2} pb={2}>
                    Initialize Serum Market to Place Order
                  </Box>
                  {initializingSerum ? (
                    <CircularProgress />
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleInitializeSerum}
                    >
                      Initialize Serum
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </DialogFullscreenMobile>
  );
};

export default memo(BuySellDialog);
