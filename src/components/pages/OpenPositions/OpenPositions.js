import Box from '@material-ui/core/Box'
import React, { useState } from 'react'
import CreateIcon from '@material-ui/icons/Create'
import BarChartIcon from '@material-ui/icons/BarChart'
import { useTheme } from '@material-ui/core/styles'
import Page from '../Page'

import TabCustom from '../../Tab'

import PositionRow from './PositionRow'
import useOpenPositions from '../../../hooks/useOpenPositions'
import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
import { Heading } from './Heading'
import { WrittenOptionsTable } from './WrittenOptionsTable'
import EmptySvg from './EmptySvg'
import useWallet from '../../../hooks/useWallet'

const OpenPositions = () => {
  const { connected } = useWallet()
  const theme = useTheme()
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

  const hasOpenPositions = positionRows.length > 0

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
          <Box
            w="100%"
            minHeight="514px"
            bgcolor={theme.palette.background.medium}
            display="flex"
            flexDirection="column"
          >
            <Heading>Open Positions</Heading>
            <Box
              display="flex"
              flexDirection="row"
              alignItems="flex-start"
              bgcolor={theme.palette.background.paper}
              p={1}
              fontSize={'14px'}
            >
              <Box p={1} pl={2} width="10%">
                Asset
              </Box>
              <Box p={1} width="10%">
                Type
              </Box>
              <Box p={1} width="10%">
                Strike ($)
              </Box>
              <Box p={1} width="10%">
                Price ($)
              </Box>
              <Box p={1} width="11%">
                Contract Size
              </Box>
              <Box p={1} width="11%">
                Position Size
              </Box>
              <Box p={1} width="14%">
                Expiration
              </Box>
              <Box p={1} width="10%">
                PNL
              </Box>
              <Box p={1} pr={2} align="right" width="13%" textAlign="left">
                Action
              </Box>
            </Box>
            {hasOpenPositions && connected ? (
              positionRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <PositionRow
                    key={row.market.optionMintKey.toString()}
                    row={row}
                  />
                ))
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
                p={3}
                flexGrow="1"
              >
                <EmptySvg />
                <Box color={theme.palette.border.main}>
                  {connected
                    ? 'You have no open positions'
                    : 'Wallet not connected'}
                </Box>
              </Box>
            )}
          </Box>
        )}
        {selectedTab === 1 && (
          <Box bgcolor={theme.palette.background.medium}>
            <WrittenOptionsTable />
          </Box>
        )}
      </Box>
    </Page>
  )
}

export default OpenPositions
