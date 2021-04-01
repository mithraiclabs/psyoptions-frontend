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
import React, { useState, useEffect } from 'react'
import propTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

import theme from '../utils/theme'
import { createInitializeMarketTx } from '../utils/serum'
import useConnection from '../hooks/useConnection'
import useWallet from '../hooks/useWallet'
import useSerum from '../hooks/useSerum'
import useOwnedTokenAccounts from '../hooks/useOwnedTokenAccounts'

import OrderBook from './OrderBook'

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
}) => {
  const { connection, dexProgramId } = useConnection()
  const { wallet, pubKey } = useWallet()
  const { serumMarkets, fetchSerumMarket } = useSerum()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()
  const [orderType, setOrderType] = useState('limit')
  const [orderSize, setOrderSize] = useState(1)
  const [limitPrice, setLimitPrice] = useState(0)
  const [initializingSerum, setInitializingSerum] = useState(false)
  const [orderbookLoaded, setOrderbookLoaded] = useState(false)
  const [orderbook, setOrderbook] = useState({
    bids: [],
    asks: [],
  })

  const optionAccounts = ownedTokenAccounts[optionMintAddress] || []
  const writerAccounts = ownedTokenAccounts[writerTokenMintKey] || []
  const contractsWritten = writerAccounts.reduce(
    (a, b) => a + (b?.amount || 0),
    0,
  )
  const openPositionSize = optionAccounts.reduce(
    (a, b) => a + (b?.amount || 0),
    0,
  )

  // console.log(optionAccounts)

  const serumMarketData = serumMarkets[serumKey]
  const serum = serumMarketData?.serumMarket

  // Load full orderbook if serum instance exists
  useEffect(() => {
    ;(async () => {
      if (serum && !orderbookLoaded) {
        // console.log('getting order book')
        const book = await serum.getOrderbook()
        setOrderbook(book)
        setOrderbookLoaded(true)
        // console.log(book)
      }
    })()
  }, [serum, orderbookLoaded, setOrderbook, setOrderbookLoaded])

  const parsedOrderSize =
    Number.isNaN(parseFloat(orderSize)) || orderSize < 1
      ? 1
      : parseInt(orderSize, 10)

  const parsedLimitPrice = new BigNumber(
    Number.isNaN(parseFloat(limitPrice)) || limitPrice < 0 ? 0 : limitPrice,
  )

  const collateralRequired =
    amountPerContract &&
    amountPerContract.multipliedBy(parsedOrderSize).toString()

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

      const { tx1, tx2, market } = await createInitializeMarketTx({
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
      console.log('confirmed', txid1)

      const txid2 = await connection.sendRawTransaction(signed[1].serialize())
      await connection.confirmTransaction(txid2)
      console.log('confirmed', txid2)

      console.log('market created', market.publicKey.toString())

      // Load the market instance into serum context state
      // There may be a more efficient way to do this part since we have the keypair here
      // Open to suggestions / refactoring
      await fetchSerumMarket(...serumKey.split('-'))
    } catch (e) {
      console.error(e)
    } finally {
      setInitializingSerum(false)
    }
  }

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
            <Box pt={1}>Open Position: {openPositionSize}</Box>
            <Box py={1}>
              Written: {contractsWritten}{' '}
              <span style={{ opacity: 0.5 }}>
                ({contractsWritten * amountPerContract.toNumber()}{' '}
                {uAssetSymbol} locked)
              </span>
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
                Collateral req to mint: {collateralRequired} {uAssetSymbol}
              </Box>
              <Box pt={'2px'} style={{ fontSize: '12px' }}>
                Current Value: $TODO USD
              </Box>
              <Box pt={'2px'} style={{ fontSize: '12px' }}>
                Available: TODO {uAssetSymbol}
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
                  <OrderBook {...orderbook} />
                  <Box
                    pt={3}
                    pb={1}
                    display="flex"
                    flexDirection="row"
                    width="100%"
                  >
                    <Box pr={1} width="50%">
                      <BuyButton
                        fullWidth
                        disabled={
                          (!orderbook?.asks?.length &&
                            orderType === 'market') ||
                          (orderType === 'limit' &&
                            parsedLimitPrice.isLessThanOrEqualTo(0))
                        }
                      >
                        Buy
                      </BuyButton>
                    </Box>
                    <Box pl={1} width="50%">
                      <SellButton
                        fullWidth
                        disabled={
                          (!orderbook?.bids?.length &&
                            orderType === 'market') ||
                          (orderType === 'limit' &&
                            parsedLimitPrice.isLessThanOrEqualTo(0))
                        }
                      >
                        Mint/Sell
                      </SellButton>
                    </Box>
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
                    }. Mint/Sell will lock the required collateral (${collateralRequired} ${
                      type === 'call' ? uAssetSymbol : qAssetSymbol
                    }) until the contract expires or is exercised.`}
                  </Box>
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
