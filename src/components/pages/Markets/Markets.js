import { Box, FormControlLabel, Switch } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { withStyles } from '@material-ui/core/styles'

import { getLastFridayOfMonths } from '../../../utils/dates'
import theme from '../../../utils/theme'

import useAssetList from '../../../hooks/useAssetList'
import useOptionsMarkets from '../../../hooks/useOptionsMarkets'
import useOptionsChain from '../../../hooks/useOptionsChain'

import Page from '../Page'
import Select from '../../Select'
import SelectAsset from '../../SelectAsset'
import CallPutRow from './CallPutRow'
import BuySellDialog from '../../BuySellDialog'
import Loading from '../../Loading'
import RefreshButton from '../../RefreshButton'

const dblsp = `${'\u00A0'}${'\u00A0'}`

const THeadCell = withStyles({
  root: {
    padding: '4px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    height: '48px',
    border: 'none',
  },
})(TableCell)

const THeadCellStrike = withStyles({
  root: {
    padding: '4px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    height: '48px',
    border: 'none',
  },
})(TableCell)

const TCellLoading = withStyles({
  root: {
    padding: '16px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    height: '52px',
    border: 'none',
  },
})(TableCell)

const TCellStrike = withStyles({
  root: {
    padding: '16px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    height: '52px',
    border: 'none',
    background: theme.palette.background.default,
  },
})(TableCell)

const rowTemplate = {
  call: {
    key: '',
    bid: '',
    ask: '',
    change: '',
    volume: '',
    openInterest: '',
    size: '',
    emptyRow: true,
    actionInProgress: false,
  },
  put: {
    key: '',
    bid: '',
    ask: '',
    change: '',
    volume: '',
    openInterest: '',
    size: '',
    emptyRow: true,
    actionInProgress: false,
  },
}

const expirations = getLastFridayOfMonths(10)

const Markets = () => {
  const {
    uAsset,
    qAsset,
    setUAsset,
    setQAsset,
    assetListLoading,
  } = useAssetList()
  const [date, setDate] = useState(expirations[0])
  const { chain, fetchOptionsChain } = useOptionsChain()
  const { marketsLoading, fetchMarketData } = useOptionsMarkets()
  const [round, setRound] = useState(true)
  const [buySellDialogOpen, setBuySellDialogOpen] = useState(false)
  const [callPutData, setCallPutData] = useState({ type: 'call' })

  const fullPageLoading = assetListLoading || marketsLoading

  let precision
  if (round && chain[0]?.strike) {
    const n = chain[0].strike
    if (n >= 1) {
      precision = 2
    } else {
      const s = n.toString(10).replace('.', '')
      const numZeros = s.match(/^0+/)[0]?.length || 0
      precision = 3 + numZeros
    }
  }

  const rows = [
    ...chain,
    ...Array(Math.max(9 - chain.length, 0))
      .fill(rowTemplate)
      .map((row, i) => ({
        ...row,
        key: `empty-${i}`,
      })),
  ]

  useEffect(() => {
    fetchOptionsChain(date.unix())
  }, [fetchOptionsChain, date])

  // Open buy/sell/mint modal
  const handleBuySellClick = (callOrPut) => {
    console.log(callOrPut)
    setCallPutData(callOrPut)
    setBuySellDialogOpen(true)
  }

  const buySellDialogHeading = callPutData
    ? `${callPutData.uAssetSymbol}-${
        callPutData.qAssetSymbol
      }${dblsp}|${dblsp}${date.format(
        'D MMM YYYY',
      )}${dblsp}|${dblsp}${callPutData.type.slice(0, 1).toUpperCase()}`
    : '--'

  return (
    <Page>
      <BuySellDialog
        {...callPutData}
        heading={buySellDialogHeading}
        open={buySellDialogOpen}
        onClose={() => setBuySellDialogOpen(false)}
        round={round}
        precision={precision}
        uAssetDecimals={uAsset?.decimals || 0}
        qAssetDecimals={qAsset?.decimals || 0}
      />
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
      >
        <Box
          py={[0, 0, 2]}
          display="flex"
          flexDirection={['column', 'column', 'row']}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box
            width={['100%', '100%', 'auto']}
            display="flex"
            flexDirection={['column', 'column', 'row']}
            alignItems={['left', 'left', 'center']}
            justifyContent="space-between"
          >
            <Box px={0} py={0} width={['100%', '100%', '300px']}>
              <Select
                variant="filled"
                label="Expiration Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                options={expirations.map((d) => ({
                  value: d,
                  text: `${d.format('ll')} | 23:59:59 UTC`,
                }))}
                style={{
                  minWidth: '100%',
                }}
              />
            </Box>
            <Box px={2} pt={[2, 2, 0]} display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={round}
                    onChange={() => setRound(!round)}
                    name="round-strike-prices"
                    color="secondary"
                  />
                }
                label="Round Strike Prices"
              />
            </Box>
          </Box>
          <Box
            px={[1, 1, 0]}
            py={[2, 2, 1]}
            width={['100%', '100%', 'auto']}
            fontSize="12px"
            display="flex"
            alignItems="center"
          >
            <Box px={1}>
              <Box>
                <SelectAsset
                  selectedAsset={uAsset}
                  onSelectAsset={(asset) => {
                    if (asset === qAsset) {
                      setQAsset(uAsset)
                    }
                    setUAsset(asset)
                  }}
                />
              </Box>
            </Box>
            <Box>
              <h3 style={{ margin: 0 }}>/</h3>
            </Box>
            <Box pl={1} pr={[1, 1, 0]}>
              <Box>
                <SelectAsset
                  selectedAsset={qAsset}
                  onSelectAsset={(asset) => {
                    if (asset === uAsset) {
                      setUAsset(qAsset)
                    }
                    setQAsset(asset)
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box position="relative">
          <Box
            position="absolute"
            zIndex={5}
            right={['16px', '16px', '1px']}
            top={'8px'}
            bgcolor={theme.palette.background.default}
          >
            <RefreshButton
              loading={fullPageLoading}
              onRefresh={fetchMarketData}
            />
          </Box>
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell colSpan={7}>
                    <h3 style={{ margin: 0 }}>
                      {`Calls${
                        uAsset && qAsset && !assetListLoading
                          ? `  (${uAsset.tokenSymbol}/${qAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </TableCell>
                  <TableCell colSpan={1} />
                  <TableCell colSpan={7}>
                    <h3 style={{ margin: 0 }}>
                      {`Puts${
                        uAsset && qAsset && !assetListLoading
                          ? `  (${qAsset.tokenSymbol}/${uAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <THeadCell align="left">Action</THeadCell>
                  <THeadCell align="left">Size</THeadCell>
                  <THeadCell align="left">Bid</THeadCell>
                  <THeadCell align="left">Ask</THeadCell>
                  <THeadCell align="left">Change</THeadCell>
                  <THeadCell align="left">Volume</THeadCell>
                  <THeadCell align="left">Open Interest</THeadCell>

                  <THeadCellStrike align="center">Strike</THeadCellStrike>

                  <THeadCell align="right">Size</THeadCell>
                  <THeadCell align="right">Bid</THeadCell>
                  <THeadCell align="right">Ask</THeadCell>
                  <THeadCell align="right">Change</THeadCell>
                  <THeadCell align="right">Volume</THeadCell>
                  <THeadCell align="right">Open Interest</THeadCell>
                  <THeadCell align="right">Action</THeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  return fullPageLoading ? (
                    <tr>
                      <TCellLoading
                        colSpan={7}
                        style={{
                          backgroundColor: theme.palette.background.medium,
                        }}
                      >
                        <Loading />
                      </TCellLoading>
                      <TCellStrike />
                      <TCellLoading
                        colSpan={7}
                        style={{
                          backgroundColor: theme.palette.background.medium,
                        }}
                      >
                        <Loading />
                      </TCellLoading>
                    </tr>
                  ) : (
                    <CallPutRow
                      key={`${row.key}`}
                      row={row}
                      uAsset={uAsset}
                      qAsset={qAsset}
                      date={date}
                      precision={precision}
                      round={round}
                      onClickBuySellCall={handleBuySellClick}
                      onClickBuySellPut={handleBuySellClick}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Page>
  )
}

export default Markets
