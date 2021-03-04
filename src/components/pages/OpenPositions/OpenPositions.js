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
    markprice: 'TODO',
    size: positions[key]?.reduce(
      (acc, tokenAccount) => acc + tokenAccount.amount,
      0,
    ),
    strike: markets[key]?.strikePrice,
    optionMarketKey: markets[key]?.optionMarketDataAddress,
    quoteAssetKey: markets[key]?.qAssetMint,
    underlyingAssetKey: markets[key]?.uAssetMint,
    optionContractTokenKey: markets[key]?.optionMintAddress,
  }))
  // temp
  console.log('pos rows', positionRows)

  const testPositionRows = [{
    accounts: [{
      amount: 1,
      mint: { bn: 'BN'},
      pubKey: "82cTMtjyqyYz8rBPwdD9Rt4oZ3x3F6ZqHt6G5qmj8TE4"
    }, {
      amount: 1,
      mint: { bn: 'BN'},
      pubKey: "36AY4DmbSvizz4sfL1JLfyrVQhdVFLYFAxLSQXbRQ9We"
    }],
    assetPair: "ETHUSDC",
    expiration: 1617235200,
    markprice: "TODO",
    optionContractTokenKey: "12zztxVg6dT6qTiMnNoVYhuyrh85Aw12paZL1F9jX1Wc",
    optionMarketKey: "8ufo6P8FefAeVd8bc3hBnKqKA6JnqGXhxah6ntt9MRsn",
    quoteAssetKey: "6S7z4EgA39BTXyVQhjyNpaMvfH88JQhjvPwq4RcpByXB",
    size: 1,
    strike: "2000",
    underlyingAssetKey: "3hCGythLqAaF1mMnB1zxESgNUVfPanuknLquHb1ASprb",
  }, {
    accounts: [{
      amount: 2,
      mint: {_bn: 'BN'},
      pubKey: "8wdQSavku2vBEQpgMQFEsagzCXCHgy4YGmfytspUx1yV"}, {
        amount: 1,
      mint: { bn: 'BN'},
      pubKey: "36AY4DmbSvizz4sfL1JLfyrVQhdVFLYFAxLSQXbRQ9We"
      }],
    assetPair: "ETHUSDC",
    expiration: 1617235200,
    markprice: "TODO",
    optionContractTokenKey: "GQdg99FToa8yHswMT85BgWF8K88B4fKCvLzdhF1166XZ",
    optionMarketKey: "Cm4G3PYDd8gNFBuU3JoXNyQLEMeXsUadyVnabPnSH2Ec",
    quoteAssetKey: "6S7z4EgA39BTXyVQhjyNpaMvfH88JQhjvPwq4RcpByXB",
    size: 2,
    strike: "1400",
    underlyingAssetKey: "3hCGythLqAaF1mMnB1zxESgNUVfPanuknLquHb1ASprb"
  }]
  // end temp
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
                  <TableCell width="5%"/>
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
                {testPositionRows
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
