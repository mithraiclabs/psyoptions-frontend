import { Chip } from '@material-ui/core'
import React, { useState } from 'react'
import Collapse from '@material-ui/core/Collapse'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import PropTypes from 'prop-types'
import useExerciseOpenPosition from '../../../hooks/useExerciseOpenPosition'
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../../hooks/useNotifications'
import { formatExpirationTimestamp } from '../../../utils/format'

const PositionRow = ({ row }) => {
  const [visible, setVisible] = useState(false)
  const {
    ownedTokenAccounts,
    updateOwnedTokenAccounts,
  } = useOwnedTokenAccounts()
  const { pushNotification } = useNotifications

  const onRowClick = () => {
    if (row.accounts.length > 1) {
      setVisible((vis) => !vis)
    }
  }

  const ownedQAssetKey =
    ownedTokenAccounts && ownedTokenAccounts[row.quoteAssetKey][0]?.pubKey
  const ownedUAssetKey =
    ownedTokenAccounts && ownedTokenAccounts[row.underlyingAssetKey][0]?.pubKey
  const ownedOAssetKey =
    ownedTokenAccounts &&
    ownedTokenAccounts[row.optionContractTokenKey][0]?.pubKey

  const { exercise } = useExerciseOpenPosition(
    row.optionMarketKey,
    ownedQAssetKey,
    ownedUAssetKey,
    ownedOAssetKey,
  )

  const handleExercisePosition = async () => {
    try {
      await exercise()
    } catch (err) {
      console.log(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
    await updateOwnedTokenAccounts()
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
        <TableCell width="20%">{row.assetPair}</TableCell>
        <TableCell width="15%">{row.strike}</TableCell>
        <TableCell width="15%">TODO</TableCell>
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
          colSpan={6}
        >
          <Collapse in={visible} timeout="auto" unmountOnExit>
            <Table>
              <TableBody>
                {row.accounts.map((account) => (
                  <TableRow
                    key={account.pubKey}
                    hover
                    role="checkbox"
                    tabIndex={-1}
                  >
                    <TableCell width="20%" />
                    <TableCell width="15%">{row.strike}</TableCell>
                    <TableCell width="15%">TODO</TableCell>
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

PositionRow.propTypes = {
  row: PropTypes.shape({
    accounts: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    assetPair: PropTypes.string.isRequired,
    expiration: PropTypes.number.isRequired,
    optionContractTokenKey: PropTypes.string.isRequired,
    optionMarketKey: PropTypes.string.isRequired,
    quoteAssetKey: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    strike: PropTypes.string.isRequired,
    underlyingAssetKey: PropTypes.string.isRequired,
  }).isRequired,
}

export default PositionRow
