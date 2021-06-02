import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import TableRow from '@material-ui/core/TableRow'

import CircularProgress from '@material-ui/core/CircularProgress'
import Button from '@material-ui/core/Button'
import moment from 'moment'

import theme from '../../../utils/theme'
import useSerum from '../../../hooks/useSerum'
import useWallet from '../../../hooks/useWallet'
import useNotifications from '../../../hooks/useNotifications'
import { useImpliedVol } from '../../../hooks/useImpliedVol'

import Loading from '../../Loading'
import {
  useSerumOrderbook,
  useSubscribeSerumOrderbook,
} from '../../../hooks/Serum'
import {
  useSPLTokenMintInfo,
  useSubscribeSPLTokenMint,
} from '../../../hooks/SPLToken'
import { useOptionMarket } from '../../../hooks/useOptionMarket'

import ConnectButton from '../../ConnectButton'
import { useInitializeMarkets } from '../../../hooks/useInitializeMarkets'

import { TCell, TCellLoading, TCellStrike } from './styles'

const Empty = ({ children }) => (
  <span style={{ opacity: '0.3' }}>{children}</span>
)

const Bid = ({ children }) => (
  <span style={{ color: theme.palette.success.main }}>{children}</span>
)

const Ask = ({ children }) => (
  <span style={{ color: theme.palette.error.light }}>{children}</span>
)

const CallPutRow = ({
  row,
  round,
  precision,
  uAsset,
  qAsset,
  date,
  onClickBuySellCall,
  onClickBuySellPut,
  markPrice,
}) => {
  const { connected } = useWallet()
  const { pushNotification } = useNotifications()
  const { serumMarkets } = useSerum()
  const initializeMarkets = useInitializeMarkets()
  const { orderbook: callOrderbook } = useSerumOrderbook(row.call?.serumKey)
  useSubscribeSerumOrderbook(row.call?.serumKey)
  const { orderbook: putOrderbook } = useSerumOrderbook(row.put?.serumKey)
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
  const callOptionMintInfo = useSPLTokenMintInfo(callMarket?.optionMintKey)
  const putOptionMintInfo = useSPLTokenMintInfo(putMarket?.optionMintKey)
  useSubscribeSPLTokenMint(callMarket?.optionMintKey)
  useSubscribeSPLTokenMint(putMarket?.optionMintKey)

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
    ? { backgroundColor: theme.palette.background.tableHighlight }
    : undefined
  const putCellStyle = row.strike?.gte(markPrice)
    ? { backgroundColor: theme.palette.background.tableHighlight }
    : undefined

  return (
    <TableRow hover role="checkbox" tabIndex={-1}>
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
            p="8px"
            onClick={() =>
              onClickBuySellCall({
                type: 'call',
                ...row.call,
                strike: row.strike,
              })
            }
          >
            Buy/Sell
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            p="8px"
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
          <TCell align="left" style={callCellStyle} width={'70px'}>
            {(callBidIV && `${callBidIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="left" style={callCellStyle} width={'90px'}>
            {callHighestBid ? (
              <Bid>${callHighestBid.toFixed(2)}</Bid>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell align="left" style={callCellStyle} width={'90px'}>
            {callLowestAsk ? (
              <Ask>${callLowestAsk.toFixed(2)}</Ask>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell align="left" style={callCellStyle} width={'70px'}>
            {(callAskIV && `${callAskIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="left" style={callCellStyle}>
            {row.call?.change || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="left" style={callCellStyle}>
            {row.call?.volume || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="left" style={callCellStyle}>
            {callOptionMintInfo?.supply.toString() || <Empty>{'—'}</Empty>}
          </TCell>
        </>
      )}

      <TCellStrike align="center">
        <h4 style={{ margin: 0, fontWeight: 400 }}>
          {formatStrike(row.strike, precision)}
        </h4>
      </TCellStrike>

      {row.put?.serumKey && serumMarkets[row.put?.serumKey]?.loading ? (
        <TCellLoading colSpan={7} style={putCellStyle}>
          <Loading />
        </TCellLoading>
      ) : (
        <>
          <TCell align="right" style={putCellStyle} width={'70px'}>
            {(putBidIV && `${putBidIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="right" style={putCellStyle} width={'90px'}>
            {putHighestBid ? (
              <Bid>${putHighestBid.toFixed(2)}</Bid>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell align="right" style={putCellStyle} width={'90px'}>
            {putLowestAsk ? (
              <Ask>${putLowestAsk.toFixed(2)}</Ask>
            ) : (
              <Empty>{'—'}</Empty>
            )}
          </TCell>
          <TCell align="right" style={putCellStyle} width={'70px'}>
            {(putAskIV && `${putAskIV.toFixed(1)}%`) || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="right" style={putCellStyle}>
            {row.put?.change || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="right" style={putCellStyle}>
            {row.put?.volume || <Empty>{'—'}</Empty>}
          </TCell>
          <TCell align="right" style={putCellStyle}>
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
            p="8px"
            onClick={() =>
              onClickBuySellPut({ type: 'put', ...row.put, strike: row.strike })
            }
          >
            Buy/Sell
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            p="8px"
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
    </TableRow>
  )
}

const CallOrPut = PropTypes.shape({
  emptyRow: PropTypes.bool,
  initialized: PropTypes.bool,
  bid: PropTypes.string,
  ask: PropTypes.string,
  change: PropTypes.string,
  volume: PropTypes.string,
  openInterest: PropTypes.string,
  size: PropTypes.string.isRequired,
  serumKey: PropTypes.string,

  // BigNumber.js objects:
  amountPerContract: PropTypes.object, // eslint-disable-line
  quoteAmountPerContract: PropTypes.object, // eslint-disable-line
})
const Asset = PropTypes.shape({
  tokenSymbol: PropTypes.string,
  mintAddress: PropTypes.string,
})

CallPutRow.propTypes = {
  // eslint-disable-next-line react/require-default-props
  row: PropTypes.shape({
    strike: PropTypes.object, // eslint-disable-line
    call: CallOrPut,
    put: CallOrPut,
  }),
  // eslint-disable-next-line react/require-default-props
  uAsset: Asset,
  // eslint-disable-next-line react/require-default-props
  qAsset: Asset,
  // eslint-disable-next-line react/require-default-props
  date: PropTypes.shape({
    unix: PropTypes.func,
  }),
  // Precision for strike price rounding with .toFixed
  precision: PropTypes.number,
  round: PropTypes.bool,
  // Current market price of the underlying asset on serum
  markPrice: PropTypes.number,
}

CallPutRow.defaultProps = {
  round: false,
  precision: 2,
}

export default CallPutRow
