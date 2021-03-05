import React from 'react'
import Chip from '@material-ui/core/Chip'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { useWrittenOptions } from '../../../hooks/useWrittenOptions'
import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
import { formatExpirationTimestamp } from '../../../utils/format'
import { Heading } from './Heading'

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
              <TableCell width="5%"/>
              <TableCell width="15%">Asset Pair</TableCell>
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
              const expired = nowInSeconds > market.expiration
              const onCloseWrittenOption = () => {
                // TODO wire up to Close Post Expiration
                // this will return the underlying asset to the Option Writer
                // if their contract has not been exercised
              }
              return (
                <TableRow key={marketKey}>
                  <TableCell width="5%"/>
                  <TableCell width="15%">{`${market.uAssetSymbol}${market.qAssetSymbol}`}</TableCell>
                  <TableCell width="15%">{market.strikePrice}</TableCell>
                  <TableCell width="15%">
                    {market.size} {market.uAssetSymbol}
                  </TableCell>
                  <TableCell width="15%">
                    {-writtenOptions[marketKey].length}
                  </TableCell>
                  <TableCell width="20%">
                    {formatExpirationTimestamp(market.expiration)}
                  </TableCell>
                  {expired ? (
                    <TableCell align="right" width="15%">
                      <Chip
                        clickable
                        size="small"
                        label="Exercise"
                        color="primary"
                        variant="outlined"
                        onClick={onCloseWrittenOption}
                      />
                    </TableCell>
                  ) : (
                    <TableCell align="right" width="15%" />
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
