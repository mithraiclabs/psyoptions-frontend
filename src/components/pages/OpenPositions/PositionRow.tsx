import React, { useCallback, useState } from 'react'
import Box from '@material-ui/core/Box'
import Collapse from '@material-ui/core/Collapse'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import Tooltip from '@material-ui/core/Tooltip'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import * as Sentry from '@sentry/react'
import BigNumber from 'bignumber.js'

import useExerciseOpenPosition from '../../../hooks/useExerciseOpenPosition'
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../../hooks/useNotifications'
import { formatExpirationTimestamp } from '../../../utils/format'
import { OptionMarket, TokenAccount } from '../../../types'
import { useSerumMarket, useSerumOrderbook } from '../../../hooks/Serum'
import { getPriceFromSerumOrderbook } from '../../../utils/orderbook'

const useStyles = makeStyles({
  dropdownOpen: {
    transform: 'rotate(-180deg)',
  },
  dropdownClosed: {
    transform: 'rotate(0)',
  },
})

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: (theme.palette.background as any).lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip)

const PositionRow: React.VFC<{
  row: {
    accounts: TokenAccount[]
    assetPair: string
    uAssetSymbol: string
    expiration: number
    market: OptionMarket
    size: number
    strikePrice: string
    uAssetMintAddress: string
    qAssetSymbol: string
    qAssetMintAddress: string
    amountPerContract: BigNumber
    quoteAmountPerContract: BigNumber
  }
}> = ({ row }) => {
  const classes = useStyles()
  const [visible, setVisible] = useState(false)
  const { ownedTokenAccounts } = useOwnedTokenAccounts()
  const { pushNotification } = useNotifications()
  const serumMarketKey = `${row.market.optionMintKey}-${row?.qAssetMintAddress}`
  useSerumMarket(serumMarketKey)
  const nowInSeconds = Date.now() / 1000
  const expired = row.expiration <= nowInSeconds

  // const { orderbook } = useSerumOrderbook(serumMarketKey)
  // const price = getPriceFromSerumOrderbook(orderbook)

  // TODO -- The way we were getting market price was incorrect because it was pulling in the price of the options themselves, not the underlying asset. We should be pulling in the price of the underlying asset so we can calculate how much profit would be made from exercising. I left the above code in so that when we fix it later we don't have to start over.
  const price = null

  let optionType = ''
  if (row?.uAssetSymbol) {
    optionType = row?.uAssetSymbol?.match(/^USD/) ? 'put' : 'call'
  }

  const strike =
    optionType === 'put'
      ? row.amountPerContract.dividedBy(row.quoteAmountPerContract).toString()
      : row?.strikePrice

  const contractSize =
    optionType === 'call'
      ? row.amountPerContract.toString()
      : row.quoteAmountPerContract.toString()

  const onRowClick = () => {
    if (row.accounts.length > 1) {
      setVisible((vis) => !vis)
    }
  }

  const ownedQAssetKey = ownedTokenAccounts[row.qAssetMintAddress]?.[0]?.pubKey
  const ownedUAssetKey = ownedTokenAccounts[row.uAssetMintAddress]?.[0]?.pubKey
  const ownedOAssetKey =
    ownedTokenAccounts[row.market.optionMintKey.toString()]?.[0]?.pubKey

  const { exercise } = useExerciseOpenPosition(
    row.market,
    // TODO remove `toString` when useExerciseOpenPosition is refactored
    ownedQAssetKey && ownedQAssetKey.toString(),
    ownedUAssetKey && ownedUAssetKey.toString(),
    ownedOAssetKey && ownedOAssetKey.toString(),
  )

  const handleExercisePosition = useCallback(async () => {
    try {
      await exercise()
    } catch (err) {
      Sentry.captureException(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
  }, [exercise, pushNotification])

  const uAssetSymbol =
    optionType === 'put' ? row?.qAssetSymbol : row?.uAssetSymbol

  const exerciseTooltipLabel = `${
    optionType === 'put' ? 'Sell' : 'Purchase'
  } ${contractSize} ${
    (optionType === 'put' ? row?.qAssetSymbol : row?.uAssetSymbol) ||
    'underlying asset'
  } for ${strike} ${
    (optionType === 'put' ? row?.uAssetSymbol : row?.qAssetSymbol) ||
    'quote asset'
  }`

  return (
    <>
      <Box
        onClick={onRowClick}
        role="checkbox"
        tabIndex={-1}
        key={row.market.optionMintKey.toString()}
        display="flex"
        flexDirection="row"
        alignItems="center"
        p={1}
      >
        <Box
          p={1}
          pl={2}
          width="12%"
          display="flex"
          flexDirection="row"
          alignItems="center"
        >
          <Avatar style={{ width: 32, height: 32 }} />
          <Box pl={1}>{uAssetSymbol}</Box>
        </Box>
        <Box p={1} width="8%">
          {optionType}
        </Box>
        <Box p={1} width="10%">
          {strike}
        </Box>
        <Box p={1} width="10%">
          {price ? `$${price.toFixed(2)}` : '-'}
        </Box>
        <Box p={1} width="10%">
          {contractSize}
        </Box>
        <Box p={1} width="10%">
          {row.size}
        </Box>
        <Box p={1} width="16%">
          {formatExpirationTimestamp(row.expiration)}
        </Box>
        <Box p={1} width="9%">{`+0.0%`}</Box>
        <Box p={1} width="10%">
          {!expired && (
            <StyledTooltip title={<Box p={2}>{exerciseTooltipLabel}</Box>}>
              <Button
                color="primary"
                variant="outlined"
                onClick={handleExercisePosition}
              >
                Exercise
              </Button>
            </StyledTooltip>
          )}
        </Box>
        <Box width="5%" p={1} pr={2}>
          {row.accounts.length > 1 && (
            <KeyboardArrowDown
              className={
                visible ? classes.dropdownOpen : classes.dropdownClosed
              }
            />
          )}
        </Box>
      </Box>
      <Box key={`${row.market.optionMintKey}Collapsible`}>
        <Collapse in={visible} timeout="auto" unmountOnExit>
          <Box>
            {row.accounts.map((account) => (
              <Box
                key={`${account?.pubKey}`}
                display="flex"
                flexDirection="row"
                alignItems="center"
                p={1}
              >
                <Box p={1} pl={2} width="12%" />
                <Box p={1} width="8%" />
                <Box p={1} width="10%" />
                <Box p={1} width="10%" />
                <Box p={1} width="10%">
                  {contractSize}
                </Box>
                <Box p={1} width="10%">
                  {account.amount}
                </Box>
                <Box p={1} width="16%" />
                <Box p={1} width="9%">{`+0.0%`}</Box>
                <Box p={1} width="10%">
                  {!expired && (
                    <StyledTooltip
                      title={<Box p={2}>{exerciseTooltipLabel}</Box>}
                    >
                      <Button
                        color="primary"
                        variant="outlined"
                        onClick={handleExercisePosition}
                      >
                        Exercise
                      </Button>
                    </StyledTooltip>
                  )}
                </Box>
                <Box width="5%" p={1} pr={2} />
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    </>
  )
}

export default React.memo(PositionRow)
