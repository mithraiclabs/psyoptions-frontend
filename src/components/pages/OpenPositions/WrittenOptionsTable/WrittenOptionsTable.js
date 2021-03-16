import React from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { useWrittenOptions } from '../../../../hooks/useWrittenOptions'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { Heading } from '../Heading'
import { WrittenOptionRow } from './WrritenOptionRow'

// TODO handle the case where the writer has multiple underlying asset accounts
export const WrittenOptionsTable = () => {
  const writtenOptions = useWrittenOptions()
  const { markets } = useOptionsMarkets()
  const nowInSeconds = Date.now() / 1000

  return (
    <>
      <Heading>Written Options</Heading>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width="20%">Asset Pair</TableCell>
              <TableCell width="15%">Strike</TableCell>
              <TableCell width="15%">Locked</TableCell>
              <TableCell width="15%">Size</TableCell>
              <TableCell width="20%">Expiration</TableCell>
              <TableCell align="right" width="15%">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(writtenOptions).map((marketKey) => {
              const market = markets[marketKey]
              return (
                <WrittenOptionRow
                  expired={nowInSeconds > market.expiration}
                  key={marketKey}
                  marketKey={marketKey}
                  optionsWritten={writtenOptions[marketKey]}
                />
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
