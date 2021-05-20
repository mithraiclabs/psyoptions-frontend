import { Chip } from '@material-ui/core'
import React, { useCallback, useState } from 'react'
import Collapse from '@material-ui/core/Collapse'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import { makeStyles } from '@material-ui/core/styles'
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

const PositionRow: React.VFC<{
  row: {
    accounts: TokenAccount[]
    assetPair: string
    uAssetSymbol: string
    expiration: number
    market: OptionMarket
    optionContractTokenKey: string
    optionMarketKey: string
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
    ownedTokenAccounts[row.optionContractTokenKey]?.[0]?.pubKey

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

  return (
    <>
      <TableRow
        hover
        onClick={onRowClick}
        role="checkbox"
        tabIndex={-1}
        key={row.optionContractTokenKey}
      >
        <TableCell width="5%">
          {row.accounts.length > 1 && (
            <KeyboardArrowDown
              className={
                visible ? classes.dropdownOpen : classes.dropdownClosed
              }
            />
          )}
        </TableCell>
        <TableCell width="10%">{row.assetPair}</TableCell>
        <TableCell width="10%">{optionType}</TableCell>
        <TableCell width="10%">{strike}</TableCell>
        <TableCell width="11%">
          {price ? `$${price.toFixed(2)}` : '-'}
        </TableCell>
        <TableCell width="12%">{contractSize}</TableCell>
        <TableCell width="12%">{row.size}</TableCell>
        <TableCell width="15%">
          {formatExpirationTimestamp(row.expiration)}
        </TableCell>
        <TableCell align="right" width="15%">
          {!expired && (
            <Chip
              clickable
              size="small"
              label="Exercise"
              color="primary"
              variant="outlined"
              onClick={handleExercisePosition}
            />
          )}
        </TableCell>
      </TableRow>
      <TableRow key={`${row.optionContractTokenKey}Collapsible`}>
        <TableCell
          style={{ borderWidth: 0, padding: 0, margin: 0 }}
          colSpan={7}
        >
          <Collapse in={visible} timeout="auto" unmountOnExit>
            <Table>
              <TableBody>
                {row.accounts.map((account) => (
                  <TableRow
                    key={account.pubKey.toString()}
                    hover
                    role="checkbox"
                    tabIndex={-1}
                  >
                    <TableCell width="5%" />
                    <TableCell width="10%" />
                    <TableCell width="10%" />
                    <TableCell width="10%">{strike}</TableCell>
                    <TableCell width="11%" />
                    <TableCell width="12%" />
                    <TableCell width="12%">{account.amount}</TableCell>
                    <TableCell width="15%">
                      {formatExpirationTimestamp(row.expiration)}
                    </TableCell>
                    <TableCell align="right" width="15%">
                      {!expired && (
                        <Chip
                          clickable
                          size="small"
                          label="Exercise"
                          color="primary"
                          variant="outlined"
                          onClick={handleExercisePosition}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default React.memo(PositionRow)
