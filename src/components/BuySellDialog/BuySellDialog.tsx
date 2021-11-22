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
import { PlusMinusIntegerInput } from '../PlusMinusIntegerInput';
import { TokenAccount } from '../../types';
import useWalletInfo from '../../hooks/useWalletInfo';
import { useRecoilValue } from 'recoil';
import { optionsMap, quoteMint, underlyingMint } from '../../recoil';
import { useTokenByMint } from '../../hooks/useNetworkTokens';
import { useTokenMintInfo } from '../../hooks/useTokenMintInfo';
import moment from 'moment';
import { useNormalizeAmountOfMintBN } from '../../hooks/useNormalizeAmountOfMintBN';
import { useNormalizedContractSize } from '../../hooks/useNormalizedContractSize';

const bgLighterColor = (theme.palette.background as any).lighter;

const orderTypes = ['limit', 'market'];

// TODO fix all the things

const BuySellDialog: React.VFC<{
  key: string;
  open: boolean;
  onClose: () => void;
  qAssetMint: string;
  uAssetMint: string;
  strike: BigNumber;
  round: boolean;
  precision: number;
  type: string;
  optionKey: PublicKey;
  serumAddress: string;
  date: Moment;
  markPrice: number;
  setLimitPrice: React.Dispatch<React.SetStateAction<string>>;
  limitPrice: string;
}> = ({
  open,
  optionKey,
  onClose,
  strike,
  round,
  precision,
  type,
  serumAddress,
  markPrice,
  setLimitPrice,
  limitPrice,
}) => {
  const [orderType, setOrderType] = useState('limit');
  const [orderSize, setOrderSize] = useState<number | null>(1);
  const [optionAccounts, setOptionAccounts] = useState([] as TokenAccount[]);
  const [writerAccounts, setWriterAccounts] = useState([] as TokenAccount[]);
  const [uAssetAccounts, setUAssetAccounts] = useState([] as TokenAccount[]);
  const [contractsWritten, setContractsWritten] = useState(0);
  const [openPositionSize, setOpenPositionSize] = useState(0);
  const [qAssetBalance, setQAssetBalance] = useState(0);
  const [uAssetBalance, setUAssetBalance] = useState(0);
  const [initializingSerum] = useState(false);
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { balance } = useWalletInfo();
  const placeSellOrder = usePlaceSellOrder(serumAddress);
  const placeBuyOrder = usePlaceBuyOrder(serumAddress);
  const { serumMarkets } = useSerum();
  const { orderbook } = useSerumOrderbook(serumAddress);
  const { feeRates: serumFeeRates, publicKey: serumDiscountFeeKey } =
    useSerumFeeDiscountKey();
  const { ownedTokenAccounts, loadingOwnedTokenAccounts } =
    useOwnedTokenAccounts();
  const _underlyingMint = useRecoilValue(underlyingMint);
  const _quoteMint = useRecoilValue(quoteMint);
  const option = useRecoilValue(optionsMap(optionKey?.toString()));
  const underlyingAsset = useTokenByMint(_underlyingMint ?? '');
  const quoteAsset = useTokenByMint(_quoteMint ?? '');
  const quoteMintInfo = useTokenMintInfo(_quoteMint);
  const underlyingMintInfo = useTokenMintInfo(_underlyingMint);
  const quoteMintDecimals =
    quoteMintInfo?.decimals || quoteAsset?.decimals || 0;
  const underlyingMintDecimals =
    underlyingMintInfo?.decimals || underlyingAsset?.decimals || 0;
  const isCall =
    _underlyingMint && option?.underlyingAssetMint.equals(_underlyingMint);
  const normalizeOptionUnderlyingSize = useNormalizeAmountOfMintBN(
    option?.underlyingAssetMint ?? null,
  );
  const sizeOfContract = useNormalizedContractSize();

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
    return sizeOfContract
      ? Math.max(
          sizeOfContract * (orderSize ?? 0) - openPositionSize * sizeOfContract,
        )
      : 'N/A';
  }, [sizeOfContract, orderSize, openPositionSize]);

  useEffect(() => {
    const newOptionAccounts = ownedTokenAccounts[`${option?.optionMint}`] || [];
    const newWriterAccounts =
      ownedTokenAccounts[`${option?.writerTokenMint}`] || [];
    const newUAssetAccounts =
      ownedTokenAccounts[_underlyingMint?.toString() ?? ''] || [];
    const newQAssetAccounts =
      ownedTokenAccounts[_quoteMint?.toString() ?? ''] || [];
    setOptionAccounts(newOptionAccounts);
    setWriterAccounts(newWriterAccounts);
    setUAssetAccounts(newUAssetAccounts);

    setOpenPositionSize(getHighestAccount(newOptionAccounts)?.amount || 0);
    setContractsWritten(getHighestAccount(newWriterAccounts)?.amount || 0);

    setQAssetBalance(
      (getHighestAccount(newQAssetAccounts)?.amount || 0) /
        10 ** quoteMintDecimals,
    );
    let tempBalance =
      (getHighestAccount(newUAssetAccounts)?.amount || 0) /
      10 ** underlyingMintDecimals;
    if (_underlyingMint?.toString() === WRAPPED_SOL_ADDRESS) {
      // if asset is wrapped Sol, use balance of wallet account
      tempBalance = balance ?? 0 / LAMPORTS_PER_SOL;
    }
    setUAssetBalance(tempBalance);
  }, [
    ownedTokenAccounts,
    balance,
    _underlyingMint,
    _quoteMint,
    quoteMintDecimals,
    underlyingMintDecimals,
    option?.optionMint,
    option?.writerTokenMint,
  ]);

  const formatStrike = (sp: BigNumber) => {
    if (!sp) return '—';
    return round ? sp.toFixed(precision) : sp.toString(10);
  };

  const handlePlaceSellOrder = useCallback(async () => {
    if (
      !serumMarketData ||
      !serumMarketData?.serumMarket ||
      !wallet?.publicKey ||
      !option ||
      !orderbook
    ) {
      return;
    }
    setPlaceOrderLoading(true);
    try {
      const numberOfContracts = (orderSize ?? 0) - openPositionSize;
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
          payer: optionTokenKey as PublicKey,
          side: 'sell',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === 'market'
              ? calculatePriceWithSlippage(orderSize ?? 0, orderbook.bids)
              : parsedLimitPrice.toNumber(),
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          size: orderSize ?? 0,
          // TODO create true mapping https://github.com/project-serum/serum-ts/blob/6803cb95056eb9b8beced9135d6956583ae5a222/packages/serum/src/market.ts#L1163
          orderType: orderType === 'market' ? 'ioc' : 'limit',
          // This will be null if a token with the symbol SRM does
          // not exist in the supported asset list
          feeDiscountPubkey: serumDiscountFeeKey,
          // serum fee rate. Should use the taker fee even if limit order if it's likely to match an order
          feeRate: undefined,
        },
        // TODO remove this
        uAsset: {
          tokenSymbol:
            underlyingAsset?.symbol ?? underlyingAsset?.address ?? '',
          mintAddress: underlyingAsset?.address ?? '',
          decimals: underlyingMintDecimals,
        },
        option,
        optionUnderlyingSize: normalizeOptionUnderlyingSize(
          option.underlyingAmountPerContract,
        ),
        uAssetTokenAccount: underlyingAssetSrcKey
          ? ({
              pubKey: underlyingAssetSrcKey,
              amount:
                uAssetAccounts.find((asset) =>
                  asset.pubKey.equals(underlyingAssetSrcKey),
                )?.amount || 0,
              mint: _underlyingMint,
            } as TokenAccount)
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
    serumMarketData,
    wallet?.publicKey,
    option,
    orderbook,
    orderSize,
    openPositionSize,
    optionAccounts,
    uAssetAccounts,
    writerAccounts,
    placeSellOrder,
    orderType,
    parsedLimitPrice,
    serumDiscountFeeKey,
    underlyingAsset?.symbol,
    underlyingAsset?.address,
    underlyingMintDecimals,
    normalizeOptionUnderlyingSize,
    _underlyingMint,
    pushErrorNotification,
  ]);

  const handleBuyOrder = useCallback(async () => {
    if (
      !serumMarketData ||
      !serumMarketData?.serumMarket ||
      !wallet?.publicKey ||
      !option ||
      !orderbook
    )
      return;

    setPlaceOrderLoading(true);

    try {
      const serumQuoteTokenAccounts =
        ownedTokenAccounts[
          // @ts-ignore: serum market._decoded
          serumMarketData.serumMarket._decoded.quoteMint.toString()
        ] || [];
      const serumQuoteTokenKey = getHighestAccount(
        serumQuoteTokenAccounts,
      )?.pubKey;
      const optionTokenKey = getHighestAccount(optionAccounts)?.pubKey;

      await placeBuyOrder({
        option,
        serumMarket: serumMarketData?.serumMarket,
        optionDestinationKey: optionTokenKey,
        orderArgs: {
          owner: wallet.publicKey,
          // For Serum, the payer is really the account of the asset being sold
          payer: serumQuoteTokenKey as PublicKey,
          side: 'buy',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === 'market'
              ? calculatePriceWithSlippage(orderSize ?? 0, orderbook?.asks)
              : parsedLimitPrice.toNumber(),
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          size: orderSize ?? 0,
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
    serumMarketData,
    wallet?.publicKey,
    option,
    orderbook,
    ownedTokenAccounts,
    optionAccounts,
    placeBuyOrder,
    orderType,
    orderSize,
    parsedLimitPrice,
    serumDiscountFeeKey,
    serumFeeRates?.taker,
    pushErrorNotification,
  ]);

  const serumMarketQuoteAssetSymbol = !isCall
    ? underlyingAsset?.symbol
    : quoteAsset?.symbol;
  const serumMarketQuoteAssetBalance = !isCall ? uAssetBalance : qAssetBalance;
  const breakeven: number | null =
    orderType === 'market'
      ? calculateBreakevenForMarketOrder(
          strike?.toNumber() ?? 0,
          sizeOfContract,
          orderSize ?? 0,
          orderbook?.asks ?? [],
          !isCall,
        )
      : calculateBreakevenForLimitOrder(
          strike?.toNumber() ?? 0,
          sizeOfContract,
          parsedLimitPrice.toNumber(),
          !isCall,
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
          <h2 style={{ margin: '0' }}>{`${
            underlyingAsset?.symbol ?? _underlyingMint?.toString()
          }-${quoteAsset?.symbol ?? _quoteMint?.toString()} | ${moment(
            (option?.expirationUnixTimestamp.toNumber() ?? 0) * 1000,
          ).format('D MMM YYYY')} | ${isCall ? 'Call' : 'Put'}`}</h2>
          <Button onClick={onClose} style={{ minWidth: '40px' }}>
            <Close />
          </Button>
        </Box>
        <Box flexDirection={['column', 'column', 'row']} display="flex" pb={1}>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box pt={1}>
              Strike: {formatStrike(strike)}{' '}
              {isCall
                ? `${quoteAsset?.symbol}/${underlyingAsset?.symbol}`
                : `${underlyingAsset?.symbol}/${quoteAsset?.symbol}`}
            </Box>
            <Box pt={1}>
              Contract Size: {sizeOfContract}{' '}
              {!isCall ? quoteAsset?.symbol : underlyingAsset?.symbol}
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
                    ({contractsWritten * sizeOfContract}{' '}
                    {underlyingAsset?.symbol} locked)
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
                  : `${collateralRequired} ${underlyingAsset?.symbol}`}
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
                  : `${underlyingAsset?.symbol}: ${uAssetBalance} `}
              </Box>
              <Box pt={1}>
                {loadingOwnedTokenAccounts
                  ? 'Loading...'
                  : `${quoteAsset?.symbol}: ${qAssetBalance} `}
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
                    {...(orderbook ?? { asks: [], bids: [] })}
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
                            orderCost={parsedLimitPrice.multipliedBy(
                              orderSize ?? 0,
                            )}
                            parsedOrderSize={orderSize}
                            qAssetBalance={serumMarketQuoteAssetBalance}
                            onClick={handleBuyOrder}
                          />
                        </Box>
                        <Box pl={1} width="50%">
                          <SellButton
                            parsedLimitPrice={parsedLimitPrice}
                            openPositionSize={openPositionSize}
                            numberOfBids={orderbook?.bids?.length || 0}
                            uAssetSymbol={
                              underlyingAsset?.symbol ??
                              _underlyingMint?.toString() ??
                              ''
                            }
                            uAssetBalance={uAssetBalance}
                            orderType={orderType}
                            parsedOrderSize={orderSize ?? 0}
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
                      : `${orderSize} ${type}${
                          (orderSize ?? 0) > 1 ? 's' : ''
                        } @ ${
                          orderType === 'limit'
                            ? `${parsedLimitPrice} ${
                                isCall
                                  ? quoteAsset?.symbol
                                  : underlyingAsset?.symbol
                              } ${(orderSize ?? 0) > 1 ? 'each' : ''}`
                            : 'market price'
                        }`}
                  </Box>
                  <Box alignSelf="flex-start" pt={1} pb={2}>
                    Breakeven:
                    {orderSize && breakeven && !isNaN(breakeven)
                      ? ` $${breakeven}`
                      : ' -'}
                  </Box>
                  <Box
                    py={2}
                    borderTop={`1px solid ${bgLighterColor}`}
                    fontSize={'14px'}
                  >
                    {`This is a ${
                      isCall ? 'covered call' : 'secured put'
                    }. Mint/Sell will lock the required collateral (${collateralRequired} ${
                      underlyingAsset?.symbol
                    }) until the contract expires or is exercised.`}
                  </Box>
                  <UnsettledFunds serumMarketAddress={serumAddress} />
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
                      onClick={() => {
                        // TODO route user to initialize page with params query param for option market
                      }}
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
