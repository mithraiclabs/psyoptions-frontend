import { Box, Chip, Paper } from '@material-ui/core'
import React from 'react'
import Page from './Page'
import theme from '../../utils/theme'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { makeStyles } from '@material-ui/core/styles'

const darkBorder = `1px solid ${theme.palette.background.main}`

// add new columns here
const columns = [
  { id: 'assetpair', label: 'Asset Pair', minWidth: 170 },
  { id: 'strike', label: 'Strike', minWidth: 170 },
  { id: 'markprice', label: 'Mark Price', minWidth: 100 },
  {
    id: 'size',
    label: 'Size',
    minWidth: 100,
    format: (value) => value.toLocaleString('en-US'),
  },
  {
    id: 'expiration',
    label: 'Expiration',
    minWidth: 170,
    format: (value) => {
      const date = new Date(value)
      return date.toUTCString()
    },
  },
  {
    id: 'action',
    label: 'Action',
    minWidth: 170,
    align: 'right',
  },
]

// A place to manipulate data params to create an addition column to display
// i.e. size * mark price to generate value of position
// and subsequently a column and an addition item into the returned object
const createData = (assetpair, strike, markprice, size, expiration) => {
  return { assetpair, strike, markprice, size, expiration }
}
// pair name, strike, mark price, size count, expiry
// need to get the open positions from the api and then
// need a function to take in data to return out the rows below
const rows = [
  createData('SOLUSDT', 12, 11.5, 10, 1616716800000),
  createData('SOLBTC', 0.0001, 0.0001889, 3, 1616716800000),
  createData('SRMUSDT', 5, 4.7, 4, 1616716800000),
  createData('SRMBTC', 0.0008, 0.00008184, 5, 1616716800000),
  createData('BTCUSDT', 64000, 57789.5, 1, 1616716800000),
]

const handleClosePosition = (params) => {
  // TODO: find hook for closing contract and apply it here
  alert('Executed (callput) of (position) @ (price)')
}

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
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  return (
    <Page>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={[0, 0, 4]}
      >
        <Paper
          style={{
            width: '100%',
            // maxWidth: '500px',
          }}
        >
          <Box>
            <Box p={2} textAlign="center" borderBottom={darkBorder}>
              <h2 style={{ margin: '10px 0 0' }}>Open Positions</h2>
            </Box>

            <TableContainer className={classes.container}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      return (
                        <TableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={row.code}
                        >
                          {columns.map((column) => {
                            const value = row[column.id]
                            return (
                              <TableCell key={column.id} align={column.align}>
                                {column.id === 'action' ? (
                                  <Chip
                                    // need to fix the key
                                    key={row[column.id] + row.code}
                                    clickable
                                    size="small"
                                    label="Close Position"
                                    color="primary"
                                    variant="outlined"
                                    onClick={() => handleClosePosition()}
                                  />
                                ) : column.format &&
                                  typeof value === 'number' ? (
                                  column.format(value)
                                ) : (
                                  value
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Box>
    </Page>
  )
}

export default OpenPositions
