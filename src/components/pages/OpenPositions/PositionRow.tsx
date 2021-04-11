import { Chip } from '@material-ui/core'
import React, { useState } from 'react'
import Collapse from '@material-ui/core/Collapse'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import * as Sentry from '@sentry/react'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import { makeStyles } from '@material-ui/core/styles'
import useExerciseOpenPosition from '../../../hooks/useExerciseOpenPosition'
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../../hooks/useNotifications'
import { formatExpirationTimestamp } from '../../../utils/format'
import { OptionMarket, TokenAccount } from '../../../types'
import useAssetList from '../../../hooks/useAssetList'
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
    expiration: number
    market: OptionMarket
    optionContractTokenKey: string
    optionMarketKey: string
    quoteAssetKey: string
    size: number
    strike: string
    underlyingAssetKey: string
  }
}> = ({ row }) => {
  const classes = useStyles()
  const [visible, setVisible] = useState(false)
  const { qAsset } = useAssetList()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()
  const { pushNotification } = useNotifications()
  const serumMarketKey = `${row.market.optionMintAddress}-${qAsset.mintAddress}`
  useSerumMarket(serumMarketKey)
  const { orderbook } = useSerumOrderbook(serumMarketKey)
  const price = getPriceFromSerumOrderbook(orderbook)

  const onRowClick = () => {
    if (row.accounts.length > 1) {
      setVisible((vis) => !vis)
    }
  }

  const ownedQAssetKey = ownedTokenAccounts[row.quoteAssetKey]?.[0]?.pubKey
  const ownedUAssetKey = ownedTokenAccounts[row.underlyingAssetKey]?.[0]?.pubKey
  const ownedOAssetKey =
    ownedTokenAccounts[row.optionContractTokenKey]?.[0]?.pubKey

  const { exercise } = useExerciseOpenPosition(
    row.market,
    // TODO remove `toString` when useExerciseOpenPosition is refactored
    ownedQAssetKey.toString(),
    ownedUAssetKey.toString(),
    ownedOAssetKey.toString(),
  )

  const handleExercisePosition = async () => {
    try {
      await exercise()
    } catch (err) {
      console.log(err)
      Sentry.captureException(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
  }

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
        <TableCell width="15%">{row.assetPair}</TableCell>
        <TableCell width="15%">{row.strike}</TableCell>
        <TableCell width="15%">{price ?? '-'}</TableCell>
        <TableCell width="15%">{row.size}</TableCell>
        <TableCell width="20%">
          {formatExpirationTimestamp(row.expiration)}
        </TableCell>
        <TableCell align="right" width="15%">
          <Chip
            clickable
            size="small"
            label="Exercise"
            color="primary"
            variant="outlined"
            onClick={handleExercisePosition}
          />
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
                    <TableCell width="15%" />
                    <TableCell width="15%">{row.strike}</TableCell>
                    <TableCell width="15%" />
                    <TableCell width="15%">{account.amount}</TableCell>
                    <TableCell width="20%">
                      {formatExpirationTimestamp(row.expiration)}
                    </TableCell>
                    <TableCell align="right" width="15%">
                      <Chip
                        clickable
                        size="small"
                        label="Exercise"
                        color="primary"
                        variant="outlined"
                        onClick={handleExercisePosition}
                      />
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

export default PositionRow
