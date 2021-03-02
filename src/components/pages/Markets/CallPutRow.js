import React, { useState, useCallback } from 'react'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import { withStyles } from '@material-ui/core/styles'
import { CircularProgress } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import BN from 'bn.js'

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


const CallPutRow = ({row, uAsset, qAsset, date}) =>{
  const { connect, connected } = useWallet()
  const { pushNotification } = useNotifications()
  const ownedTokenAccounts = useOwnedTokenAccounts()

  const [loading, setLoading] = useState({call: false, put: false})

  const {
    initializeMarkets,
    getMarket,
    createAccountsAndMint,
  } = useOptionsMarkets()


  const handleInitialize = useCallback(async ({ type }) => {
    setLoading(prevState => ({...prevState, [type]: true}))
    try {
      const ua = type === 'call' ? uAsset : qAsset
      const qa = type === 'call' ? qAsset : uAsset

      const uaDecimals = new BN(10).pow(new BN(ua.decimals))
      const qaDecimals = new BN(10).pow(new BN(qa.decimals))
      let strike
      let sizeAsU64
      // IF initializing a PUT the strike is the reciprocal of the CALL strike displayed
      //  and the size is CALL strike price * amountPerContract
      if (type === 'call') {
        strike = new BN(row.strike).mul(uaDecimals)
        sizeAsU64 = new BN(row.size).mul(qaDecimals)
      } else {
        strike = uaDecimals.div(new BN(row.strike))
        sizeAsU64 = new BN(row.strike).mul(new BN(row.size)).mul(qaDecimals)
      }

      await initializeMarkets({
        size: sizeAsU64.toString(10),
        strikePrices: [strike.toString(10)],
        uAssetSymbol: ua.tokenSymbol,
        qAssetSymbol: qa.tokenSymbol,
        uAssetMint: ua.mintAddress,
        qAssetMint: qa.mintAddress,
        expiration: date.unix(),
      })
    } catch (err) {
      console.log(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
      setLoading(prevState => ({...prevState, [type]: false}))
    }
  }, [uAsset, qAsset, initializeMarkets, date, row.strike, row.size, pushNotification])

  const handleMint = useCallback(async ({ type }) => {
    setLoading(prevState => ({...prevState, [type]: true}))
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
      setLoading(prevState => ({...prevState, [type]: false}))
    }
  }, [createAccountsAndMint, date, getMarket, ownedTokenAccounts, pushNotification, qAsset, row.size, row.strike, uAsset])

  return (<TableRow
    hover
    role="checkbox"
    tabIndex={-1}
  >
    <TCell align="left">
      {row.call?.emptyRow ? (
        '--'
      ) : loading.call ? (
        <CircularProgress size={32} />
      ) : !connected ? (
        <Button
          variant="outlined"
          color="primary"
          p="8px"
          onClick={connect}
        >
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
        <Button
          variant="outlined"
          color="primary"
          p="8px"
          onClick={connect}
        >
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

CallPutRow.propTypes = {
}
export default CallPutRow;
