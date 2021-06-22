import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import React, { useState } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import CreateIcon from '@material-ui/icons/Create'
import BarChartIcon from '@material-ui/icons/BarChart'
import { makeStyles } from '@material-ui/core/styles'
import Page from '../Page'

import TabCustom from '../../Tab'

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
    market: markets[key],
    qAssetMintAddress: markets[key]?.qAssetMint,
    uAssetMintAddress: markets[key]?.uAssetMint,
    qAssetSymbol: markets[key]?.qAssetSymbol,
    uAssetSymbol: markets[key]?.uAssetSymbol,
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
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="flex-start"
          alignItems="flex-start"
        >
          <TabCustom
            selected={selectedTab === 0}
            onClick={() => setSelectedTab(0)}
          >
            <Box display="flex" flexDirection="row" alignItems="center">
              <Box px={1}>
                <BarChartIcon size={24} />
              </Box>
              <Box px={1} textAlign="left" lineHeight={'22px'}>
                <Box fontSize={'16px'} fontWeight={700}>
                  Open Positions
                </Box>
                <Box fontSize={'13px'}>0 currently open</Box>
              </Box>
            </Box>
          </TabCustom>
          <TabCustom
            selected={selectedTab === 1}
            onClick={() => setSelectedTab(1)}
          >
            <Box display="flex" flexDirection="row" alignItems="center">
              <Box px={1}>
                <CreateIcon size={18} />
              </Box>
              <Box px={1} textAlign="left" lineHeight={'22px'}>
                <Box fontSize={'16px'} fontWeight={700}>
                  Written Options
                </Box>
                <Box fontSize={'13px'}>0 currently written</Box>
              </Box>
            </Box>
          </TabCustom>
        </Box>
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
                    <TableCell width="10%">Asset Pair</TableCell>
                    <TableCell width="10%">Type</TableCell>
                    <TableCell width="10%">Strike</TableCell>
                    <TableCell width="11%">Market Price</TableCell>
                    <TableCell width="12%">Contract Size</TableCell>
                    <TableCell width="12%">Position Size</TableCell>
                    <TableCell width="15%">Expiration</TableCell>
                    <TableCell align="right" width="15%">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positionRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <PositionRow
                        key={row.market.optionMintKey.toString()}
                        row={row}
                      />
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
