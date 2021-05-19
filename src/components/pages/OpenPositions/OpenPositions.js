import { Box, Paper } from '@material-ui/core'
import React, { useState } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import { makeStyles } from '@material-ui/core/styles'
import Page from '../Page'

import PositionRow from './PositionRow'
import useOpenPositions from '../../../hooks/useOpenPositions'
import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
import { Heading } from './Heading'
import { WrittenOptionsTable } from './WrittenOptionsTable'

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
  const [page] = useState(0)
  const [rowsPerPage] = useState(10)
  const positions = useOpenPositions()
  const { markets } = useOptionsMarkets()
  const [selectedTab, setSelectedTab] = useState(0)

  const positionRows = Object.keys(positions).map((key) => ({
    accounts: positions[key],
    assetPair: `${markets[key]?.uAssetSymbol}-${markets[key]?.qAssetSymbol}`,
    expiration: markets[key]?.expiration,
    size: positions[key]?.reduce(
      (acc, tokenAccount) => acc + tokenAccount.amount,
      0,
    ),
    strikePrice: markets[key]?.strikePrice,
    optionMarketKey: markets[key]?.optionMarketDataAddress,
    market: markets[key],
    qAssetMintAddress: markets[key]?.qAssetMint,
    uAssetMintAddress: markets[key]?.uAssetMint,
    qAssetSymbol: markets[key]?.qAssetSymbol,
    uAssetSymbol: markets[key]?.uAssetSymbol,
    optionContractTokenKey: markets[key]?.optionMintAddress,
    amountPerContract: markets[key]?.amountPerContract,
    quoteAmountPerContract: markets[key]?.quoteAmountPerContract,
  }))

  return (
    <Page>
      <Box
        display="flex"
        justifyContent="flex-start"
        flexDirection="column"
        height="100%"
        minHeight="500px"
        pt={2}
        pb={4}
      >
        <Tabs
          value={selectedTab}
          onChange={(_, tab) => setSelectedTab(tab)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Open Positions`} />
          <Tab label={`Written Options`} />
        </Tabs>
        {selectedTab === 0 && (
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
                    <TableCell width="11.25%">Asset Pair</TableCell>
                    <TableCell width="11.25%">Type</TableCell>
                    <TableCell width="11.25%">Strike</TableCell>
                    <TableCell width="11.25%">Market Price</TableCell>
                    <TableCell width="15%">Position Size</TableCell>
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
        )}
        {selectedTab === 1 && (
          <Paper>
            <WrittenOptionsTable />
          </Paper>
        )}
      </Box>
    </Page>
  )
}

export default OpenPositions
