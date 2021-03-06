import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import { withStyles } from '@material-ui/core/styles'
import { CircularProgress } from '@material-ui/core'
import Button from '@material-ui/core/Button'
// import BN from 'bn.js'
import BigNumber from 'bignumber.js'

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
  },
})(TableCell)

const darkBorder = `1px solid ${theme.palette.background.main}`

const formatStrike = (sp) => {
  if (sp === '--') return sp
  const str = `${sp}`
  return str.match(/\..{2,}/) ? str : parseFloat(sp).toFixed(2)
}

const CallPutRow = ({ row, uAsset, qAsset, date }) => {
  const { connect, connected } = useWallet()
  const { pushNotification } = useNotifications()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()

  const [loading, setLoading] = useState({ call: false, put: false })

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

        // const uaDecimals = new BigNumber(10).pow(new BigNumber(ua.decimals))
        // const qaDecimals = new BigNumber(10).pow(new BigNumber(qa.decimals))
        
        let strike
        let size

        const {
          call, 
          put
        } = row

        // IF initializing a PUT the strike is the reciprocal of the CALL strike displayed
        //  and the size is CALL strike price * amountPerContract
        if (type === 'call') {
          console.log('Initializing a CALL. The following are from the put:')
          console.log('quoteAmountPerContract', put.quoteAmountPerContract.toString(10))
          console.log('amountPerContract', put.amountPerContract.toString(10))

          strike = new BigNumber(row.strike)
          size = new BigNumber(row.size)

          // return
        } else {
          const callStrike = call.quoteAmountPerContract.div(call.amountPerContract)
          const newPutStrike = new BigNumber(1).div(callStrike)
          const newPutSize = BigNumber.maximum(1, call.quoteAmountPerContract)

          // Remove this when comfortable with the results:
          console.log({
            newPutSize: newPutSize.toString(10),
            newPutStrike: newPutStrike.toString(10)
          })

          size = newPutSize
          strike = newPutStrike
        }

        await initializeMarkets({
          size: size.toNumber(10),
          strikePrices: [strike.toNumber(10)],
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
        setLoading((prevState) => ({ ...prevState, [type]: false }))
      }
    },
    [
      uAsset,
      qAsset,
      initializeMarkets,
      date,
      row,
      pushNotification,
    ],
  )

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
          size: type === 'call' ? row.size : row.size * row.strike, // TODO -- deal with FP imprecision
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
          uAssetAccount: ownedUAssetAccounts[0]?.pubKey || '',
          qAssetAccount: ownedQAssetAccounts[0]?.pubKey || '',
          ownedQAssetAccounts,
          mintedOptionAccount: ownedMintedOptionAccounts[0]?.pubKey || '',
          ownedMintedOptionAccounts,
        })

        console.log('Minted options token!')
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
      row.size,
      row.strike,
      uAsset,
    ],
  )

  return (
    <TableRow hover role="checkbox" tabIndex={-1}>
      <TCell align="left">
        {row.call?.emptyRow ? (
          '--'
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
              handleMint({
                type: 'call',
              })
            }
          >
            Mint
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
      <TCell align="left">{row.size}</TCell>
      <TCell align="left">{row.call?.bid}</TCell>
      <TCell align="left">{row.call?.ask}</TCell>
      <TCell align="left">{row.call?.change}</TCell>
      <TCell align="left">{row.call?.volume}</TCell>
      <TCell align="left">{row.call?.openInterest}</TCell>

      <TCell
        align="center"
        style={{
          borderLeft: darkBorder,
          borderRight: darkBorder,
          background: theme.palette.background.main,
        }}
      >
        <h3 style={{ margin: 0 }}>{formatStrike(row.strike)}</h3>
      </TCell>

      <TCell align="right">{row.size}</TCell>
      <TCell align="right">{row.put?.bid}</TCell>
      <TCell align="right">{row.put?.ask}</TCell>
      <TCell align="right">{row.put?.change}</TCell>
      <TCell align="right">{row.put?.volume}</TCell>
      <TCell align="right">{row.put?.openInterest}</TCell>
      <TCell align="right">
        {row.put?.emptyRow ? (
          '--'
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
              handleMint({
                type: 'put',
              })
            }
          >
            Mint
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
})
const Asset = PropTypes.shape({
  tokenSymbol: PropTypes.string,
  mintAddress: PropTypes.string,
})

CallPutRow.propTypes = {
  // eslint-disable-next-line react/require-default-props
  row: PropTypes.shape({
    size: PropTypes.string.isRequired,
    strike: PropTypes.string.isRequired,
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
}
export default CallPutRow
