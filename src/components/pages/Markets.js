import { Box, Paper } from '@material-ui/core'
import React, { useState } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import theme from '../../utils/theme'
import Page from './Page'
import Select from '../Select'
import SelectAsset from '../SelectAsset'
import { getNext3Months } from '../../utils/dates'

import useOptionsMarkets from '../../hooks/useOptionsMarkets'

const darkBorder = `1px solid ${theme.palette.background.main}`

const TCell = withStyles({
  root: {
    padding: '8px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    border: 'none',
    height: '52px',
  },
})(TableCell)

const rowTemplate = {
  strike: '--',
  size: '--',
  call: {
    key: '',
    size: '--',
    bid: '--',
    ask: '--',
    change: '--',
    volume: '--',
    openInterest: '--',
    emptyRow: true,
  },
  put: {
    key: '',
    size: '--',
    bid: '--',
    ask: '--',
    change: '--',
    volume: '--',
    openInterest: '--',
    emptyRow: true,
  },
}

const formatStrike = (sp) => {
  if (sp === '--') return sp
  const str = `${sp}`
  return str.match(/\..{2,}/) ? str : parseFloat(sp).toFixed(2)
}

const next3Months = getNext3Months()
const emptyRows = Array(9).fill(rowTemplate)

const Markets = () => {
  const [date, setDate] = useState(next3Months[0])

  // TODO -- set default assets, e.g. SOL/USDC
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()

  // const [rows, setRows] = useState(emptyRows)

  const { getOptionsChain } = useOptionsMarkets()

  let rows = emptyRows
  if (uAsset?.tokenSymbol && qAsset?.tokenSymbol && date) {
    const optionsChain = getOptionsChain({
      uAssetSymbol: uAsset.tokenSymbol,
      qAssetSymbol: qAsset.tokenSymbol,
      date: date.unix(),
    })
    rows = optionsChain.length ? optionsChain : emptyRows
    if (rows.length < 9) {
      rows = [...rows, ...emptyRows.slice(rows.length)]
    }
  }

  return (
    <Page>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={4}
      >
        <Box
          py={0}
          display="flex"
          flexDirection={['column', 'column', 'row']}
          alignItems="center"
          justifyContent="space-between"
          style={{
            background: `${theme.gradients.secondary}`,
          }}
        >
          <Box px={0} py={0} width={['100%', '100%', '300px']}>
            <Select
              variant="filled"
              label="Expiration Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              options={next3Months.map((d) => ({
                value: d,
                text: `${d.format('ll')}, 00:00 UTC`,
              }))}
              style={{
                minWidth: '100%',
              }}
            />
          </Box>
          <Box
            px={1}
            py={[2, 2, 1]}
            width={['100%', '100%', 'auto']}
            fontSize="12px"
            display="flex"
            alignItems="center"
          >
            <Box px={1}>
              <Box>
                <SelectAsset selectedAsset={uAsset} onSelectAsset={setUAsset} />
              </Box>
            </Box>
            <Box>
              <h3 style={{ margin: 0 }}>/</h3>
            </Box>
            <Box px={1}>
              <Box>
                <SelectAsset selectedAsset={qAsset} onSelectAsset={setQAsset} />
              </Box>
            </Box>
          </Box>
        </Box>
        <Paper>
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell colSpan={7}>
                    <h3 style={{ margin: 0 }}>
                      {`Calls${
                        uAsset && qAsset
                          ? `  (${uAsset.tokenSymbol}/${qAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </TableCell>
                  <TableCell colSpan={1} />
                  <TableCell colSpan={7}>
                    <h3 style={{ margin: 0 }}>
                      {`Puts${
                        uAsset && qAsset
                          ? `  (${qAsset.tokenSymbol}/${uAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TCell align="left">Action</TCell>
                  <TCell align="left">Size</TCell>
                  <TCell align="left">Bid</TCell>
                  <TCell align="left">Ask</TCell>
                  <TCell align="left">Change</TCell>
                  <TCell align="left">Volume</TCell>
                  <TCell align="left">Open Interest</TCell>

                  <TCell align="center">Strike</TCell>

                  <TCell align="right">Size</TCell>
                  <TCell align="right">Bid</TCell>
                  <TCell align="right">Ask</TCell>
                  <TCell align="right">Change</TCell>
                  <TCell align="right">Volume</TCell>
                  <TCell align="right">Open Interest</TCell>
                  <TCell align="right">Action</TCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={`${row.strike}-${i}`}
                  >
                    <TCell align="left">
                      {row.call?.emptyRow ? (
                        '--'
                      ) : row.call?.initialized ? (
                        <Button variant="outlined" color="primary" p="8px">
                          Mint
                        </Button>
                      ) : (
                        <Button variant="outlined" color="primary" p="8px">
                          Initialize
                        </Button>
                      )}
                    </TCell>
                    <TCell align="left">{row.call?.size}</TCell>
                    <TCell align="left">{row.call?.bid}</TCell>
                    <TCell align="left">{row.call?.ask}</TCell>
                    <TCell align="left">{row.call?.change}</TCell>
                    <TCell align="left">{row.call?.volume}</TCell>
                    <TCell align="left">{row.call?.openInterest}</TCell>

                    <TCell
                      align="center"
                      style={{
                        borderLeft: darkBorder,
                        borderRight: darkBorder,
                        background: theme.palette.background.main,
                      }}
                    >
                      <h3 style={{ margin: 0 }}>{formatStrike(row.strike)}</h3>
                    </TCell>

                    <TCell align="right">{row.put?.size}</TCell>
                    <TCell align="right">{row.put?.bid}</TCell>
                    <TCell align="right">{row.put?.ask}</TCell>
                    <TCell align="right">{row.put?.change}</TCell>
                    <TCell align="right">{row.put?.volume}</TCell>
                    <TCell align="right">{row.put?.openInterest}</TCell>
                    <TCell align="right">
                      {row.call?.emptyRow ? (
                        '--'
                      ) : row.put?.initialized ? (
                        <Button variant="outlined" color="primary" p="8px">
                          Mint
                        </Button>
                      ) : (
                        <Button variant="outlined" color="primary" p="8px">
                          Initialize
                        </Button>
                      )}
                    </TCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Page>
  )
}

export default Markets
