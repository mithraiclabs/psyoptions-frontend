/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useCallback, useMemo } from 'react'

import CircularProgress from '@material-ui/core/CircularProgress'
import Button from '@material-ui/core/Button'
import moment, { Moment } from 'moment'
import BigNumber from 'bignumber.js'

import { MintInfo } from '@solana/spl-token'
import theme from '../../../utils/theme'
import useSerum from '../../../hooks/useSerum'
import useWallet from '../../../hooks/useWallet'
import useNotifications from '../../../hooks/useNotifications'
import { useImpliedVol } from '../../../hooks/useImpliedVol'

import Loading from '../../Loading'
import { useSubscribeSerumOrderbook } from '../../../hooks/Serum'
import {
  useSPLTokenMintInfo,
  useSubscribeSPLTokenMint,
} from '../../../hooks/SPLToken'
import { useOptionMarket } from '../../../hooks/useOptionMarket'
import { useSerumOrderbooks } from '../../../context/SerumOrderbookContext'

import ConnectButton from '../../ConnectButton'
import { useInitializeMarkets } from '../../../hooks/useInitializeMarkets'

import { TCell, TCellLoading, TCellStrike, TRow } from './styles'
import { useMarketData } from '../../../context/MarketDataContext'
import { Asset, CallOrPut } from '../../../types'

const Empty = ({ children }) => (
  <span style={{ opacity: '0.3' }}>{children}</span>
)

const Bid = ({ children }) => (
  <span style={{ color: theme.palette.success.main }}>{children}</span>
)

const Ask = ({ children }) => (
  <span style={{ color: theme.palette.error.light }}>{children}</span>
)

type CallPutRowProps = {
  row: {
    strike: BigNumber
    call: CallOrPut
    put: CallOrPut
  }
  uAsset: Asset
  qAsset: Asset
  date: Moment
  // Precision for strike price rounding with .toFixed
  precision: number
  round: boolean
  // Current market price of the underlying asset on serum
  markPrice: number
  callOptionMintInfo?: MintInfo
  putOptionMintInfo?: MintInfo
  onClickBuySellCall: (callOrPut: any) => void
  onClickBuySellPut: (callOrPut: any) => void
  setLimitPrice: (callOrPut: any) => void
}

const CallPutRow = ({
  row,
  round = false,
  precision = 2,
  uAsset,
  qAsset,
  date,
  markPrice,
  callOptionMintInfo,
  putOptionMintInfo,
  onClickBuySellCall,
  onClickBuySellPut,
  setLimitPrice,
}: CallPutRowProps) => {
  const { connected } = useWallet()
  const { pushNotification } = useNotifications()
  const { serumMarkets } = useSerum()
  const initializeMarkets = useInitializeMarkets()
  const [orderbooks] = useSerumOrderbooks()
  const callOrderbook = orderbooks[row.call?.serumKey]
  const putOrderbook = orderbooks[row.put?.serumKey]
  useSubscribeSerumOrderbook(row.call?.serumKey)
  useSubscribeSerumOrderbook(row.put?.serumKey)

  const callHighestBid = callOrderbook?.bids[0]?.price
  const callLowestAsk = callOrderbook?.asks[0]?.price
  const putHighestBid = putOrderbook?.bids[0]?.price
  const putLowestAsk = putOrderbook?.asks[0]?.price
  const callMarket = useOptionMarket({
    date: date.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size: row.call?.size,
    amountPerContract: row.call?.amountPerContract,
    quoteAmountPerContract: row.call?.quoteAmountPerContract,
  })
  const putMarket = useOptionMarket({
    date: date.unix(),
    uAssetSymbol: qAsset?.tokenSymbol,
    qAssetSymbol: uAsset?.tokenSymbol,
    size: row.put?.size,
    amountPerContract: row.put?.amountPerContract,
    quoteAmountPerContract: row.put?.quoteAmountPerContract,
  })
  useSubscribeSPLTokenMint(callMarket?.optionMintKey)
  useSubscribeSPLTokenMint(putMarket?.optionMintKey)
  const marketTrackerData = useMarketData()

  // Further optimization here would be doing this in the markets page itself
  const timeToExpiry = useMemo(() => {
    return Math.max(date.diff(moment.utc(), 'years', true), 0)
  }, [date])

  const strikeAsNumber = row.strike && row.strike.toNumber()

  const callBidIV = useImpliedVol({
    optionPrice: callHighestBid || 0,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: 'call',
  })

  const callAskIV = useImpliedVol({
    optionPrice: callLowestAsk || 0,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: 'call',
  })

  const putBidIV = useImpliedVol({
    optionPrice: putHighestBid,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: 'put',
  })

  const putAskIV = useImpliedVol({
    optionPrice: putLowestAsk,
    strikePrice: strikeAsNumber,
    marketPrice: markPrice,
    timeToExpiry,
    type: 'put',
  })

  const [loading, setLoading] = useState({ call: false, put: false })

  const formatStrike = (sp) => {
    if (!sp) return <Empty>{'—'}</Empty>
    return <span>{round ? sp.toFixed(precision) : sp.toString(10)}</span>
  }

  const handleInitialize = useCallback(
    async ({ type }) => {
      setLoading((prevState) => ({ ...prevState, [type]: true }))
      try {
        const ua = type === 'call' ? uAsset : qAsset
        const qa = type === 'call' ? qAsset : uAsset
        const { call, put } = row

        let quoteAmountPerContract
        let amountPerContract

        if (type === 'call') {
          quoteAmountPerContract = put.amountPerContract
          amountPerContract = put.quoteAmountPerContract
        } else {
          quoteAmountPerContract = call.amountPerContract
          amountPerContract = call.quoteAmountPerContract
        }

        await initializeMarkets({
          amountPerContract,
          quoteAmountsPerContract: [quoteAmountPerContract],
          uAssetSymbol: ua.tokenSymbol,
          qAssetSymbol: qa.tokenSymbol,
          uAssetMint: ua.mintAddress,
          qAssetMint: qa.mintAddress,
          uAssetDecimals: ua.decimals,
          qAssetDecimals: qa.decimals,
          expiration: date.unix(),
        })
      } catch (err) {
        console.log(err)
        pushNotification({
          severity: 'error',
          message: `${err}`,
        })
      } finally {
        setLoading((prevState) => ({ ...prevState, [type]: false }))
      }
    },
    [uAsset, qAsset, initializeMarkets, date, row, pushNotification],
  )

  const callCellStyle = row.strike?.lte(markPrice)
    ? // @ts-ignore: annoying MUI theme stuff
      { backgroundColor: theme.palette.background.tableHighlight }
    : // @ts-ignore: annoying MUI theme stuff
      { backgroundColor: theme.palette.background.marketsCallPutRow }
  const putCellStyle = row.strike?.gte(markPrice)
    ? // @ts-ignore: annoying MUI theme stuff
      { backgroundColor: theme.palette.background.tableHighlight }
    : // @ts-ignore: annoying MUI theme stuff
      { backgroundColor: theme.palette.background.marketsCallPutRow }

  const openBuySellModal = (callOrPut, price = '0') => {
    // only allow full row clicking open for initialized markets
    if (callOrPut === 'call' && row.call?.initialized) {
      onClickBuySellCall({
        type: 'call',
        ...row.call,
        strike: row.strike,
      })
      setLimitPrice(price)
    }
    if (callOrPut === 'put' && row.put?.initialized) {
      onClickBuySellPut({
        type: 'put',
        ...row.put,
        strike: row.strike,
      })
      setLimitPrice(price)
    }
  }

  return (
    <TRow hover role="checkbox" tabIndex={-1}>
      <TCell align="left" style={callCellStyle} width={'120px'}>
        {row.call?.emptyRow ? (
          ''
        ) : loading.call ? (
          <CircularProgress size={32} />
        ) : !connected ? (
          <ConnectButton>Connect</ConnectButton>
        ) : row.call?.initialized ? (
          <Button
            variant="outlined"
            color="primary"
            // p="8px"
            onClick={() => openBuySellModal('call')}
          >
            Buy/Sell
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            // p="8px"
            onClick={() =>
              handleInitialize({
                type: 'call',
              })
            }
          >
            Initialize
          </Button>
        )}
      </TCell>
      {row.call?.serumKey && serumMarkets[row.call?.serumKey]?.loading ? (
        <TCellLoading colSpan={7} style={callCellStyle}>
          <Loading />
        </TCellLoading>
      ) : (
        <>
          <TCell
            align="left"
            style={callCellStyle}
            width={'70px'}
            onClick={() => openBuySellModal('call')}
          >
            {(callBidIV && `${callBidIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell
            align="left"
            style={callCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('call', callHighestBid?.toFixed(2))}
          >
            {callHighestBid ? (
              <Bid>${callHighestBid.toFixed(2)}</Bid>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="left"
            style={callCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('call', callLowestAsk?.toFixed(2))}
          >
            {callLowestAsk ? (
              <Ask>${callLowestAsk.toFixed(2)}</Ask>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="left"
            style={callCellStyle}
            width={'70px'}
            onClick={() => openBuySellModal('call')}
          >
            {(callAskIV && `${callAskIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell
            align="left"
            style={callCellStyle}
            onClick={() => openBuySellModal('call')}
          >
            {marketTrackerData?.[row.call?.serumMarketKey?.toString()]
              ?.change ? (
              `${
                marketTrackerData?.[row.call?.serumMarketKey?.toString()]
                  ?.change
              }%`
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="left"
            style={callCellStyle}
            onClick={() => openBuySellModal('call')}
          >
            {marketTrackerData?.[row.call?.serumMarketKey?.toString()]
              ?.volume || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell
            align="left"
            style={callCellStyle}
            onClick={() => openBuySellModal('call')}
          >
            {callOptionMintInfo?.supply.toString() || <Empty>{'—'}</Empty>}
          </TCell>
        </>
      )}

      <TCellStrike align="center">
        <h4 style={{ margin: 0, fontWeight: 400 }}>
          {formatStrike(row.strike)}
        </h4>
      </TCellStrike>

      {row.put?.serumKey && serumMarkets[row.put?.serumKey]?.loading ? (
        <TCellLoading colSpan={7} style={putCellStyle}>
          <Loading />
        </TCellLoading>
      ) : (
        <>
          <TCell
            align="right"
            style={putCellStyle}
            width={'70px'}
            onClick={() => openBuySellModal('put')}
          >
            {(putBidIV && `${putBidIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell
            align="right"
            style={putCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('put', putHighestBid?.toFixed(2))}
          >
            {putHighestBid ? (
              <Bid>${putHighestBid.toFixed(2)}</Bid>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="right"
            style={putCellStyle}
            width={'90px'}
            onClick={() => openBuySellModal('put', putLowestAsk?.toFixed(2))}
          >
            {putLowestAsk ? (
              <Ask>${putLowestAsk.toFixed(2)}</Ask>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="right"
            style={putCellStyle}
            width={'70px'}
            onClick={() => openBuySellModal('put')}
          >
            {(putAskIV && `${putAskIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell
            align="right"
            style={putCellStyle}
            onClick={() => openBuySellModal('put')}
          >
            {marketTrackerData?.[row.put?.serumMarketKey?.toString()]
              ?.change ? (
              `${
                marketTrackerData?.[row.put?.serumMarketKey?.toString()]?.change
              }%`
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell
            align="right"
            style={putCellStyle}
            onClick={() => openBuySellModal('put')}
          >
            {marketTrackerData?.[row.put?.serumMarketKey?.toString()]
              ?.volume || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell
            align="right"
            style={putCellStyle}
            onClick={() => openBuySellModal('put')}
          >
            {putOptionMintInfo?.supply.toString() || <Empty>{'—'}</Empty>}
          </TCell>
        </>
      )}
      <TCell align="right" style={putCellStyle} width={'120px'}>
        {row.put?.emptyRow ? (
          ''
        ) : loading.put ? (
          <CircularProgress size={32} />
        ) : !connected ? (
          <ConnectButton>Connect</ConnectButton>
        ) : row.put?.initialized ? (
          <Button
            variant="outlined"
            color="primary"
            // p="8px"
            onClick={() => openBuySellModal('put')}
          >
            Buy/Sell
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            // p="8px"
            onClick={() =>
              handleInitialize({
                type: 'put',
              })
            }
          >
            Initialize
          </Button>
        )}
      </TCell>
    </TRow>
  )
}

export default CallPutRow
