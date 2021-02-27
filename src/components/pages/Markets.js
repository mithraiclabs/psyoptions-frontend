import { Box, Chip, Hidden, Paper } from '@material-ui/core'
import React, { useState } from 'react'
import Page from './Page'
import theme from '../../utils/theme'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import Select from '../Select'
import SelectAsset from '../SelectAsset'

import { getNext3Months } from '../../utils/dates'

const TCell = withStyles({
  root: {
    padding: '8px',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    border: 'none',
  },
})(TableCell)

const darkBorder = `1px solid ${theme.palette.background.main}`

const next3Months = getNext3Months()

const emptyRows = Array(9)
  .fill({})
  .map((item) => ({
    strike: '--',
    call: {
      itm: true,
      key: '',
      lastPrice: '--',
      change: '--',
      pctChange: '--',
      volume: '--',
      openInterest: '--',
    },
    put: {
      key: '',
      lastPrice: '--',
      change: '--',
      pctChange: '--',
      volume: '--',
      openInterest: '--',
    },
  }))

const Markets = () => {
  const [date, setDate] = useState(next3Months[0])

  // TODO -- set default assets, e.g. SOL/USDC
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()

  const [rows, setRows] = useState(emptyRows)

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
          justifyContent={'space-between'}
          style={{
            background: `${theme.gradients.secondary}`,
          }}
        >
          <Box px={0} py={0} width={['100%', '100%', '300px']}>
            <Select
              variant="filled"
              label={'Expiration Date'}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              options={next3Months.map((date) => ({
                value: date,
                text: `${date.format('ll')}, 00:00 UTC`,
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
            fontSize={'12px'}
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
                  <TableCell colSpan={6}>
                    <h3 style={{ margin: 0 }}>
                      {`Calls${
                        uAsset && qAsset
                          ? `  (${uAsset.tokenSymbol}/${qAsset.tokenSymbol})`
                          : ''
                      }`}
                    </h3>
                  </TableCell>
                  <TableCell colSpan={1}></TableCell>
                  <TableCell colSpan={6}>
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
                  <TCell align="left">Last Price</TCell>
                  <TCell align="left">Change</TCell>
                  <TCell align="left">% Change</TCell>
                  <TCell align="left">Volume</TCell>
                  <TCell align="left">Open Interest</TCell>

                  <TCell align="center">Strike</TCell>

                  <TCell align="right">Last Price</TCell>
                  <TCell align="right">Change</TCell>
                  <TCell align="right">% Change</TCell>
                  <TCell align="right">Volume</TCell>
                  <TCell align="right">Open Interest</TCell>
                  <TCell align="right">Action</TCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => {
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={`${row.strike}-${row.i}`}
                    >
                      <TCell align="left">
                        {row.call?.initialized ? (
                          <Button variant="outlined" color="primary" p={'8px'}>
                            Mint
                          </Button>
                        ) : (
                          <Button variant="outlined" color="primary" p={'8px'}>
                            Initialize
                          </Button>
                        )}
                      </TCell>
                      <TCell align="left">{row.call?.lastPrice}</TCell>
                      <TCell align="left">{row.call?.change}</TCell>
                      <TCell align="left">{row.call?.pctChange}</TCell>
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
                        {row.strike}
                      </TCell>

                      <TCell align="right">{row.put?.lastPrice}</TCell>
                      <TCell align="right">{row.put?.change}</TCell>
                      <TCell align="right">{row.put?.pctChange}</TCell>
                      <TCell align="right">{row.put?.volume}</TCell>
                      <TCell align="right">{row.put?.openInterest}</TCell>
                      <TCell align="right">
                        {row.call?.initialized ? (
                          <Button variant="outlined" color="primary" p={'8px'}>
                            Mint
                          </Button>
                        ) : (
                          <Button variant="outlined" color="primary" p={'8px'}>
                            Initialize
                          </Button>
                        )}
                      </TCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Page>
  )
}

export default Markets
