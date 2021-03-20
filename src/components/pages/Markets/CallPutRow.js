import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import { withStyles } from '@material-ui/core/styles'
import { CircularProgress } from '@material-ui/core'
import Button from '@material-ui/core/Button'
// import BN from 'bn.js'
// import BigNumber from 'bignumber.js'

import theme from '../../../utils/theme'
import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
import useWallet from '../../../hooks/useWallet'
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../../hooks/useNotifications'

const TCell = withStyles({
  root: {
    padding: '8px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    border: 'none',
    height: '52px',
    background: theme.palette.background.medium,
  },
})(TableCell)

const darkBorder = `1px solid ${theme.palette.background.main}`

const CallPutRow = ({
  row,
  round,
  precision,
  uAsset,
  qAsset,
  date,
  onClickBuySellCall,
  onClickBuySellPut,
}) => {
  const { connect, connected } = useWallet()
  const { pushNotification } = useNotifications()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()

  const [loading, setLoading] = useState({ call: false, put: false })

  const formatStrike = (sp) => {
    if (!sp) return '—'
    return round ? sp.toFixed(precision) : sp.toString(10)
  }

  const {
    initializeMarkets,
    getMarket,
    createAccountsAndMint,
  } = useOptionsMarkets()

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

  // TODO -- move this to the modal
  const handleMint = useCallback(
    async ({ type }) => {
      setLoading((prevState) => ({ ...prevState, [type]: true }))
      try {
        const ua = type === 'call' ? uAsset : qAsset
        const qa = type === 'call' ? qAsset : uAsset

        const marketParams = {
          date: date.unix(),
          uAssetSymbol: ua.tokenSymbol,
          qAssetSymbol: qa.tokenSymbol,
          size: type === 'call' ? row.call?.size : row.put?.size, // TODO -- deal with FP imprecision
          price: type === 'call' ? row.strike : 1 / row.strike, // TODO -- deal with FP imprecision
        }

        const marketData = getMarket(marketParams)
        const ownedMintedOptionAccounts =
          (marketData && ownedTokenAccounts[marketData.optionMintAddress]) || []
        const ownedUAssetAccounts =
          (uAsset && ownedTokenAccounts[uAsset.mintAddress]) || []
        const ownedQAssetAccounts =
          (qAsset && ownedTokenAccounts[qAsset.mintAddress]) || []

        await createAccountsAndMint({
          ...marketParams,
          uAsset: ua,
          qAsset: qa,
          uAssetAccount: ownedUAssetAccounts[0]?.pubKey || '',
          qAssetAccount: ownedQAssetAccounts[0]?.pubKey || '',
          ownedUAssetAccounts,
          ownedQAssetAccounts,
          mintedOptionAccount: ownedMintedOptionAccounts[0]?.pubKey || '',
          ownedMintedOptionAccounts,
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
    [
      createAccountsAndMint,
      date,
      getMarket,
      ownedTokenAccounts,
      pushNotification,
      qAsset,
      row,
      uAsset,
    ],
  )

  return (
    <TableRow hover role="checkbox" tabIndex={-1}>
      <TCell align="left">
        {row.call?.emptyRow ? (
          '—'
        ) : loading.call ? (
          <CircularProgress size={32} />
        ) : !connected ? (
          <Button variant="outlined" color="primary" p="8px" onClick={connect}>
            Connect
          </Button>
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
      <TCell align="left">
        {row.call?.size ? `${row.call.size} ${uAsset?.tokenSymbol || ''}` : '—'}
      </TCell>
      <TCell align="left">{row.call?.bid || '—'}</TCell>
      <TCell align="left">{row.call?.ask || '—'}</TCell>
      <TCell align="left">{row.call?.change || '—'}</TCell>
      <TCell align="left">{row.call?.volume || '—'}</TCell>
      <TCell align="left">{row.call?.openInterest || '—'}</TCell>

      <TCell
        align="center"
        style={{
          borderLeft: darkBorder,
          borderRight: darkBorder,
          background: theme.palette.background.main,
        }}
      >
        <h4 style={{ margin: 0 }}>{formatStrike(row.strike, precision)}</h4>
      </TCell>

      <TCell align="right">
        {row.put?.size ? `${row.put.size} ${qAsset?.tokenSymbol || ''}` : '—'}
      </TCell>
      <TCell align="right">{row.put?.bid || '—'}</TCell>
      <TCell align="right">{row.put?.ask || '—'}</TCell>
      <TCell align="right">{row.put?.change || '—'}</TCell>
      <TCell align="right">{row.put?.volume || '—'}</TCell>
      <TCell align="right">{row.put?.openInterest || '—'}</TCell>
      <TCell align="right">
        {row.put?.emptyRow ? (
          '—'
        ) : loading.put ? (
          <CircularProgress size={32} />
        ) : !connected ? (
          <Button variant="outlined" color="primary" p="8px" onClick={connect}>
            Connect
          </Button>
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
}

CallPutRow.defaultProps = {
  round: false,
  precision: 2,
}

export default CallPutRow
