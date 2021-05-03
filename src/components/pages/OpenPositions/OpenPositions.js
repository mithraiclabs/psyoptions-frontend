import { Box, Paper } from '@material-ui/core'
import React from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { makeStyles } from '@material-ui/core/styles'
import Page from '../Page'

import PositionRow from './PositionRow'
import useOpenPositions from '../../../hooks/useOpenPositions'
import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
import { WrittenOptionsTable } from './WrittenOptionsTable'
import { Heading } from './Heading'

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
  container: {
    maxHeight: 440,
  },
})

const OpenPositions = () => {
  const classes = useStyles()
  const [page] = React.useState(0)
  const [rowsPerPage] = React.useState(10)
  const positions = useOpenPositions()
  const { markets } = useOptionsMarkets()

  const positionRows = Object.keys(positions).map((key) => ({
    accounts: positions[key],
    assetPair: `${markets[key]?.uAssetSymbol}${markets[key]?.qAssetSymbol}`,
    expiration: markets[key]?.expiration,
    size: positions[key]?.reduce(
      (acc, tokenAccount) => acc + tokenAccount.amount,
      0,
    ),
    strike: markets[key]?.strikePrice,
    optionMarketKey: markets[key]?.optionMarketDataAddress,
    market: markets[key],
    quoteAssetKey: markets[key]?.qAssetMint,
    underlyingAssetKey: markets[key]?.uAssetMint,
    optionContractTokenKey: markets[key]?.optionMintAddress,
  }))

  return (
    <Page>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        height="100%"
        minHeight="500px"
        pb={4}
      >
        <Paper
          style={{
            width: '100%',
          }}
        >
          <Heading>Open Positions</Heading>
          <TableContainer className={classes.container}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell width="5%" />
                  <TableCell width="15%">Asset Pair</TableCell>
                  <TableCell width="15%">Strike</TableCell>
                  <TableCell width="15%">Market Price</TableCell>
                  <TableCell width="15%">Size</TableCell>
                  <TableCell width="20%">Expiration</TableCell>
                  <TableCell align="right" width="15%">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positionRows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <PositionRow key={row.optionContractTokenKey} row={row} />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Paper style={{ marginTop: 24 }}>
          <WrittenOptionsTable />
        </Paper>
      </Box>
    </Page>
  )
}

export default OpenPositions
