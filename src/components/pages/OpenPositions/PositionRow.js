import { Chip } from '@material-ui/core'
import React, { useState } from 'react'
import Collapse from '@material-ui/core/Collapse'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import useExerciseOpenPosition from '../../../hooks/useExerciseOpenPosition'
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts'



const PositionRow = ({ columns, row }) => {
  const [visible, setVisible] = useState(false)
  const ownedTokenAccounts = useOwnedTokenAccounts()

  const onRowClick = () => {
    if (row.accounts.length > 1) {
      setVisible((vis) => !vis)
    }
  }

  const ownedQAssetKey = (ownedTokenAccounts && ownedTokenAccounts[row.quoteAssetKey][0]?.pubKey)
  const ownedUAssetKey = (ownedTokenAccounts && ownedTokenAccounts[row.underlyingAssetKey][0]?.pubKey)
  const ownedOAssetKey = (ownedTokenAccounts && ownedTokenAccounts[row.optionContractTokenKey][0]?.pubKey)
  

  const handleExercisePosition = useExerciseOpenPosition(
    row.optionMarketKey,
    ownedQAssetKey,
    ownedUAssetKey,
    ownedOAssetKey
  )

  return (
    <>
      <TableRow
        hover
        onClick={onRowClick}
        role="checkbox"
        tabIndex={-1}
        key={row.code}
      >
        {columns.map((column) => {
          const value = row[column.id]
          return (
            <TableCell
              key={column.id}
              align={column.align}
              width={column.width}
            >
              {column.id === 'action' && row.accounts.length <= 1 ? (
                <Chip
                  // need to fix the key
                  key={row[column.id] + row.code}
                  clickable
                  size="small"
                  label="Close Position"
                  color="primary"
                  variant="outlined"
                  onClick={handleExercisePosition}
                />
              ) : column.format && typeof value === 'number' ? (
                column.format(value)
              ) : (
                value
              )}
            </TableCell>
          )
        })}
      </TableRow>
      <TableRow key={`${row.code}Collapsible`}>
        <TableCell
          style={{ borderWidth: 0, padding: 0, margin: 0 }}
          colSpan={columns.length}
        >
          <Collapse in={visible} timeout="auto" unmountOnExit>
            <Table>
              <TableBody>
                {row.accounts.map((account) => (
                  <TableRow hover role="checkbox" tabIndex={-1}>
                    {columns.map((column) => {
                      let value = row[column.id]
                      if (column.id === 'size') {
                        value = account.amount
                      } else if (column.id === 'assetpair') {
                        value = ''
                      }
                      return (
                        <TableCell
                          key={column.id}
                          align={column.align}
                          width={column.width}
                        >
                          {column.id === 'action' ? (
                            <Chip
                              // need to fix the key
                              key={row[column.id] + row.code}
                              clickable
                              size="small"
                              label="Close Position"
                              color="primary"
                              variant="outlined"
                              onClick={handleExercisePosition}
                            />
                          ) : column.format && typeof value === 'number' ? (
                            column.format(value)
                          ) : (
                            value
                          )}
                        </TableCell>
                      )
                    })}
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