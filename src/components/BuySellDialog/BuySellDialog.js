import {
  Box,
  Chip,
  Dialog,
  FilledInput,
  withStyles,
  Button,
  CircularProgress,
} from '@material-ui/core'
import Done from '@material-ui/icons/Done'
import Tooltip from '@material-ui/core/Tooltip'
import React, { useState } from 'react'
import propTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import * as Sentry from '@sentry/react'

import theme from '../../utils/theme'
import { createInitializeMarketTx } from '../../utils/serum'
import useConnection from '../../hooks/useConnection'
import useWallet from '../../hooks/useWallet'
import useSerum from '../../hooks/useSerum'
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../hooks/useNotifications'
import usePlaceSellOrder from '../../hooks/usePlaceSellOrder'
import usePlaceBuyOrder from '../../hooks/usePlaceBuyOrder'

import OrderBook from '../OrderBook'
import { useSerumOrderbook } from '../../hooks/Serum'
import { WRAPPED_SOL_ADDRESS } from '../../utils/token'
import { useSerumFeeDiscountKey } from '../../hooks/Serum/useSerumFeeDiscountKey'
import { getPriceFromSerumOrderbook } from '../../utils/orderbook'
import { useOptionMarket } from '../../hooks/useOptionMarket'
import { UnsettledFunds } from './UnsettledFunds'

const successColor = theme.palette.success.main
const errorColor = theme.palette.error.main
// const primaryColor = theme.palette.primary.main
const bgLighterColor = theme.palette.background.lighter

const StyledFilledInput = withStyles({
  root: {
    borderRadius: 0,
    width: '100%',
    minWidth: '100px',
  },
  input: {
    padding: '8px 12px !important',
  },
})(FilledInput)

const PlusMinusButton = withStyles({
  root: {
    borderRadius: 0,
    minWidth: '38px',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    marginLeft: '2px',
    fontWeight: 700,
    fontSize: '24px',
    lineHeight: '24px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
  },
})(Button)

const BuyButton = withStyles({
  root: {
    backgroundColor: successColor,
    color: theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.success.light,
    },
  },
  disabled: {
    backgroundColor: theme.palette.success.dark,
  },
})(Button)

const SellButton = withStyles({
  root: {
    backgroundColor: errorColor,
    '&:hover': {
      backgroundColor: theme.palette.error.light,
    },
  },
  disabled: {
    backgroundColor: theme.palette.error.dark,
  },
})(Button)

const orderTypes = ['limit', 'market']

const getHighestAccount = (accounts) => {
  if (accounts.length === 0) return {}
  if (accounts.length === 1) return accounts[0]
  return accounts.sort((a, b) => b.amount - a.amount)[0]
}

const proptypes = {
  open: propTypes.bool,
  onClose: propTypes.func,
  heading: propTypes.string,
  amountPerContract: propTypes.object,
  uAssetSymbol: propTypes.string,
  qAssetSymbol: propTypes.string,
  qAssetMint: propTypes.string,
  uAssetMint: propTypes.string,
  uAssetDecimals: propTypes.number,
  qAssetDecimals: propTypes.number,
  strike: propTypes.object,
  round: propTypes.bool,
  precision: propTypes.number,
  type: propTypes.oneOf(['call', 'put']),
  optionMintAddress: propTypes.string,
  serumKey: propTypes.string,
}

const defaultProps = {
  amountPerContract: new BigNumber(0),
  strike: new BigNumber(0),
}

const BuySellDialog = ({
  open,
  onClose,
  heading,
  amountPerContract,
  quoteAmountPerContract,
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
  optionMintAddress,
  writerTokenMintKey,
  serumKey,
  date,
}) => {
  const { pushNotification } = useNotifications()
  const { connection, dexProgramId } = useConnection()
  const { balance, wallet, pubKey } = useWallet()
  const placeSellOrder = usePlaceSellOrder(serumKey)
  const placeBuyOrder = usePlaceBuyOrder(serumKey)
  const { serumMarkets, fetchSerumMarket } = useSerum()
  const {
    ownedTokenAccounts,
    loadingOwnedTokenAccounts,
  } = useOwnedTokenAccounts()
  const [orderType, setOrderType] = useState('limit')
  const [orderSize, setOrderSize] = useState(1)
  const [limitPrice, setLimitPrice] = useState(0)
  const [initializingSerum, setInitializingSerum] = useState(false)
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false)
  const { orderbook } = useSerumOrderbook(serumKey)
  const {
    feeRates: serumFeeRates,
    publicKey: serumDiscountFeeKey,
  } = useSerumFeeDiscountKey()
  const price = getPriceFromSerumOrderbook(orderbook)
  const optionMarket = useOptionMarket({
    date: date.unix(),
    uAssetSymbol,
    qAssetSymbol,
    size: amountPerContract.toNumber(),
    amountPerContract,
    quoteAmountPerContract,
  })

  const optionAccounts = ownedTokenAccounts[optionMintAddress] || []
  const writerAccounts = ownedTokenAccounts[writerTokenMintKey] || []
  const uAssetAccounts = ownedTokenAccounts[uAssetMint] || []

  const contractsWritten = getHighestAccount(writerAccounts)?.amount || 0
  const openPositionSize = getHighestAccount(optionAccounts)?.amount || 0
  let uAssetBalance =
    (getHighestAccount(uAssetAccounts)?.amount || 0) / 10 ** uAssetDecimals

  if (uAssetMint === WRAPPED_SOL_ADDRESS) {
    // if asset is wrapped Sol, use balance of wallet account
    uAssetBalance = balance / LAMPORTS_PER_SOL
  }

  const openPositionUAssetBalance = openPositionSize * amountPerContract
  const sufficientFundsToSell =
    openPositionSize + uAssetBalance / amountPerContract >= orderSize

  const serumMarketData = serumMarkets[serumKey]
  const serum = serumMarketData?.serumMarket

  const parsedOrderSize =
    Number.isNaN(parseFloat(orderSize)) || orderSize < 1
      ? 1
      : parseInt(orderSize, 10)

  const parsedLimitPrice = new BigNumber(
    Number.isNaN(parseFloat(limitPrice)) || limitPrice < 0 ? 0 : limitPrice,
  )

  const collateralRequired = amountPerContract
    ? Math.max(
        amountPerContract.multipliedBy(parsedOrderSize).toNumber() -
          openPositionUAssetBalance,
        0,
      )
    : 'N/A'

  const formatStrike = (sp) => {
    if (!sp) return '—'
    return round ? sp.toFixed(precision) : sp.toString(10)
  }

  const handleChangeSize = (e) => setOrderSize(e.target.value)

  const handleInitializeSerum = async () => {
    setInitializingSerum(true)

    try {
      // TODO: make tick size and quote lot size configurable... maybe?
      // Or should we just have sane defaults?
      let tickSize = 0.0001
      if (
        (type === 'call' && qAssetSymbol.match(/^USD/)) ||
        (type === 'put' && uAssetSymbol.match(/^USD/))
      ) {
        tickSize = 0.01
      }

      // This will likely be USDC or USDT but could be other things in some cases
      const quoteLotSize = new BN(
        tickSize * 10 ** (type === 'call' ? qAssetDecimals : uAssetDecimals),
      )

      // baseLotSize should be 1 -- the options market token doesn't have decimals
      const baseLotSize = new BN('1')

      const { tx1, tx2 } = await createInitializeMarketTx({
        connection,
        payer: pubKey,
        baseMint: new PublicKey(optionMintAddress),
        quoteMint:
          type === 'call'
            ? new PublicKey(qAssetMint)
            : new PublicKey(uAssetMint),
        baseLotSize,
        quoteLotSize,
        dexProgramId,
      })

      const signed = await wallet.signAllTransactions([tx1, tx2])

      const txid1 = await connection.sendRawTransaction(signed[0].serialize())
      await connection.confirmTransaction(txid1)

      const txid2 = await connection.sendRawTransaction(signed[1].serialize())
      await connection.confirmTransaction(txid2)

      // Load the market instance into serum context state
      // There may be a more efficient way to do this part since we have the keypair here
      // Open to suggestions / refactoring
      await fetchSerumMarket(...serumKey.split('-'))
    } catch (e) {
      pushNotification({
        severity: 'error',
        message: `${e}`,
      })
    } finally {
      setInitializingSerum(false)
    }
  }

  const handlePlaceSellOrder = async () => {
    setPlaceOrderLoading(true)
    try {
      const numberOfContracts = parsedOrderSize - openPositionSize
      const optionTokenKey = getHighestAccount(optionAccounts)?.pubKey
      const underlyingAssetSrcKey = getHighestAccount(uAssetAccounts)?.pubKey
      const writerTokenDestinationKey = getHighestAccount(writerAccounts)
        ?.pubKey

      await placeSellOrder({
        numberOfContractsToMint: numberOfContracts,
        serumMarket: serum,
        orderArgs: {
          owner: pubKey,
          // For Serum, the payer is really the account of the asset being sold
          payer: optionTokenKey,
          side: 'sell',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === 'market'
              ? orderbook?.bids?.[0]?.price
              : parsedLimitPrice,
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          size: parsedOrderSize,
          // TODO create true mapping https://github.com/project-serum/serum-ts/blob/6803cb95056eb9b8beced9135d6956583ae5a222/packages/serum/src/market.ts#L1163
          orderType: orderType === 'market' ? 'ioc' : orderType,
          // This will be null if a token with the symbol SRM does
          // not exist in the supported asset list
          feeDiscountPubkey: serumDiscountFeeKey,
          // serum fee rate
          feeRate: orderType === 'market' ? serumFeeRates?.taker : undefined,
        },
        uAsset: {
          tokenSymbol: uAssetSymbol,
          mintAddress: uAssetMint,
          decimals: uAssetDecimals,
        },
        optionMarket,
        uAssetTokenAccount: {
          pubKey: underlyingAssetSrcKey,
          amount: new BigNumber(
            uAssetAccounts.find((asset) =>
              asset.pubKey.equals(underlyingAssetSrcKey),
            )?.amount || 0,
          ),
          mint: new PublicKey(uAssetMint),
        },
        mintedOptionDestinationKey: optionTokenKey,
        writerTokenDestinationKey,
      })
      setPlaceOrderLoading(false)
    } catch (err) {
      setPlaceOrderLoading(false)
      console.error(err)
      Sentry.captureException(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
  }

  const handleBuyOrder = async () => {
    setPlaceOrderLoading(true)
    try {
      const serumQuoteTokenAccounts =
        ownedTokenAccounts[serum.market._decoded.quoteMint.toString()] || []
      const serumQuoteTokenKey = getHighestAccount(serumQuoteTokenAccounts)
        ?.pubKey
      const optionTokenKey = getHighestAccount(optionAccounts)?.pubKey
      await placeBuyOrder({
        optionMarket,
        serumMarket: serum,
        optionDestinationKey: optionTokenKey,
        orderArgs: {
          owner: pubKey,
          // For Serum, the payer is really the account of the asset being sold
          payer: serumQuoteTokenKey || null,
          side: 'buy',
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          price:
            orderType === 'market'
              ? orderbook?.asks?.[0]?.price
              : parsedLimitPrice,
          // Serum-ts handles adding the SPL Token decimals via their
          //  `maket.priceNumberToLots` function
          size: parsedOrderSize,
          // TODO create true mapping https://github.com/project-serum/serum-ts/blob/6803cb95056eb9b8beced9135d6956583ae5a222/packages/serum/src/market.ts#L1163
          orderType: orderType === 'market' ? 'ioc' : orderType,
          // This will be null if a token with the symbol SRM does
          // not exist in the supported asset list
          feeDiscountPubkey: serumDiscountFeeKey,
          // serum fee rate
          feeRate: orderType === 'market' ? serumFeeRates?.taker : undefined,
        },
      })
      setPlaceOrderLoading(false)
    } catch (err) {
      setPlaceOrderLoading(false)
      console.log(err)
      Sentry.captureException(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
  }

  const mintSellTooltipLabel =
    openPositionSize >= parsedOrderSize
      ? `Place sell order using: ${orderSize} owned option${
          orderSize > 1 ? 's' : ''
        }`
      : openPositionSize + uAssetBalance / amountPerContract.toNumber() >=
        parsedOrderSize
      ? `Place sell order using: ${
          openPositionSize > 0
            ? `${openPositionSize} owned option${
                openPositionSize > 1 && orderSize > 1 ? 's' : ''
              } and `
            : ''
        }${
          (parsedOrderSize - openPositionSize) * amountPerContract.toNumber()
        } ${uAssetSymbol}`
      : 'Collateral requirement not met to place sell order'

  const isSellDisabled =
    (!orderbook?.bids?.length && orderType === 'market') ||
    (orderType === 'limit' && parsedLimitPrice.isLessThanOrEqualTo(0)) ||
    !sufficientFundsToSell

  return (
    <Dialog open={open} onClose={onClose} maxWidth={'lg'}>
      <Box py={1} px={2} width="680px" maxWidth={['100%']}>
        <Box p={1} pt={2}>
          <h2 style={{ margin: '0' }}>{heading}</h2>
        </Box>
        <Box flexDirection={['column', 'column', 'row']} display="flex" pb={1}>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box pt={1}>
              Strike: {formatStrike(strike)}{' '}
              {type === 'call'
                ? `${qAssetSymbol}/${uAssetSymbol}`
                : `${uAssetSymbol}/${qAssetSymbol}`}
            </Box>
            <Box pt={1}>Mark Price: {price ?? '-'}</Box>
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
              <Box pt={1} display="flex" flexDirection="row">
                <StyledFilledInput
                  value={`${orderSize}`}
                  type="number"
                  onChange={handleChangeSize}
                  onBlur={() => {
                    if (orderSize !== parsedOrderSize) {
                      setOrderSize(parsedOrderSize)
                    }
                  }}
                />
                <PlusMinusButton
                  onClick={() => setOrderSize(Math.max(1, parsedOrderSize - 1))}
                >
                  -
                </PlusMinusButton>
                <PlusMinusButton
                  onClick={() => setOrderSize(parsedOrderSize + 1)}
                >
                  +
                </PlusMinusButton>
              </Box>
              <Box pt={1} style={{ fontSize: '12px' }}>
                Collateral req to sell:{' '}
                {loadingOwnedTokenAccounts
                  ? 'Loading...'
                  : `${collateralRequired} ${uAssetSymbol}`}
              </Box>
              <Box pt={'2px'} style={{ fontSize: '12px' }}>
                Available:{' '}
                {loadingOwnedTokenAccounts
                  ? 'Loading...'
                  : `${uAssetBalance} ${uAssetSymbol}`}
              </Box>
            </Box>
            <Box pb={1} pt={2}>
              Order Type:
              <Box pt={1}>
                {orderTypes.map((_type) => {
                  const selected = _type === orderType
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
                      }}
                    />
                  )
                })}
              </Box>
            </Box>
            <Box
              pb={1}
              pt={2}
              color={
                orderType === 'market'
                  ? theme.palette.background.lighter
                  : theme.palette.primary.main
              }
            >
              Limit Price ({type === 'call' ? qAssetSymbol : uAssetSymbol}):
              <Box pt={1}>
                <StyledFilledInput
                  type="number"
                  value={orderType === 'market' ? '' : `${limitPrice}`}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  onBlur={() => {
                    setLimitPrice(parsedLimitPrice.toString())
                  }}
                  disabled={orderType === 'market'}
                />
              </Box>
            </Box>
          </Box>
          <Box p={1} width={['100%', '100%', '50%']}>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent={serum ? 'flex-start' : 'center'}
              alignItems="center"
              width="100%"
              height="100%"
              pb={3}
            >
              {serumMarketData?.loading ? (
                <CircularProgress />
              ) : serum ? (
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
                    {placeOrderLoading ? (
                      <CircularProgress />
                    ) : (
                      <>
                        <Box pr={1} width="50%">
                          {/* <Tooltip title={buyTooltipLabel} placement="top"> */}
                          <BuyButton
                            fullWidth
                            disabled={
                              (!orderbook?.asks?.length &&
                                orderType === 'market') ||
                              (orderType === 'limit' &&
                                parsedLimitPrice.isLessThanOrEqualTo(0))
                            }
                            onClick={handleBuyOrder}
                          >
                            Buy
                          </BuyButton>
                          {/* </Tooltip> */}
                        </Box>
                        <Box pl={1} width="50%">
                          {/* Annoying thing I had to do to get MUI to stop clogging the console with "errors" that aren't real errors about how wrapping a disabled button in a tooltip won't show the tooltip... sigh */}
                          {isSellDisabled ? (
                            <SellButton
                              fullWidth
                              disabled
                              onClick={handlePlaceSellOrder}
                            >
                              Mint/Sell
                            </SellButton>
                          ) : (
                            <Tooltip
                              title={mintSellTooltipLabel}
                              placement="top"
                            >
                              <SellButton
                                fullWidth
                                onClick={handlePlaceSellOrder}
                              >
                                Mint/Sell
                              </SellButton>
                            </Tooltip>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                  <Box pt={1} pb={2}>
                    {orderType === 'limit' &&
                    parsedLimitPrice.isLessThanOrEqualTo(0)
                      ? `Invalid Limit Price: ${parsedLimitPrice}`
                      : `${parsedOrderSize} ${type}${
                          parsedOrderSize > 1 ? 's' : ''
                        } @ ${
                          orderType === 'limit'
                            ? `${parsedLimitPrice} ${
                                type === 'call' ? qAssetSymbol : uAssetSymbol
                              } ${parsedOrderSize > 1 ? 'each' : ''}`
                            : 'market price'
                        }`}
                  </Box>
                  <Box
                    py={2}
                    borderTop={`1px solid ${bgLighterColor}`}
                    fontSize={'10px'}
                  >
                    {`This is a ${
                      type === 'call' ? 'covered call' : 'secured put'
                    }. Mint/Sell will lock the required collateral (${collateralRequired} ${uAssetSymbol}) until the contract expires or is exercised.`}
                  </Box>
                  <UnsettledFunds
                    qAssetSymbol={qAssetSymbol}
                    serumKey={serumKey}
                    qAssetDecimals={qAssetDecimals}
                  />
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
    </Dialog>
  )
}

BuySellDialog.propTypes = proptypes

BuySellDialog.defaultProps = defaultProps

export default BuySellDialog
