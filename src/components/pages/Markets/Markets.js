import { Box, Paper } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { withStyles } from '@material-ui/core/styles'
import Page from '../Page'
import Select from '../../Select'
import SelectAsset from '../../SelectAsset'
import { getNext3Months } from '../../../utils/dates'

import useConnection from '../../../hooks/useConnection'
import useAssetList from '../../../hooks/useAssetList'
import useOptionChain from '../../../hooks/useOptionChain'

import CallPutRow from './CallPutRow';

const defaultAssetPairsByNetworkName = {
  Mainnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'USDC',
  },
  Devnet: {
    uAssetSymbol: 'PSYA',
    qAssetSymbol: 'USDCT', // TODO add this
  },
  Testnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'ABC',
  },
  localhost: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'USDC',
  },
}

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
    bid: '--',
    ask: '--',
    change: '--',
    volume: '--',
    openInterest: '--',
    emptyRow: true,
    actionInProgress: false,
  },
  put: {
    key: '',
    bid: '--',
    ask: '--',
    change: '--',
    volume: '--',
    openInterest: '--',
    emptyRow: true,
    actionInProgress: false,
  },
}

const next3Months = getNext3Months()
const emptyRows = Array(9).fill(rowTemplate)

const Markets = () => {
  const { endpoint } = useConnection()

  const supportedAssets = useAssetList()
  const [date, setDate] = useState(next3Months[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [rows, setRows] = useState(emptyRows)


  useEffect(() => {
    if (supportedAssets && supportedAssets.length > 0) {
      const defaultAssetPair =
        defaultAssetPairsByNetworkName[endpoint.name] || {}
      let defaultUAsset
      let defaultQAsset
      supportedAssets.forEach((asset) => {
        if (asset.tokenSymbol === defaultAssetPair.uAssetSymbol) {
          defaultUAsset = asset
        }
        if (asset.tokenSymbol === defaultAssetPair.qAssetSymbol) {
          defaultQAsset = asset
        }
      })
      if (defaultUAsset && defaultQAsset) {
        setUAsset(defaultUAsset)
        setQAsset(defaultQAsset)
      }
    }
  }, [endpoint, supportedAssets])

  const { chain } = useOptionChain(date, uAsset, qAsset)

  useEffect(() => {
    let newRows = chain.length ? chain : emptyRows

    if (newRows.length < 9) {
      newRows = [...newRows, ...emptyRows.slice(newRows.length)]
    }

    setRows(newRows)
  }, [chain])


  return (
    <Page>
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
            <Box px={1}>
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
                {rows.map((row, i) => (<CallPutRow key={i} row={row} uAsset={uAsset} qAsset={qAsset} date={date}/>))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Page>
  )
}

export default Markets
