import { Box, CircularProgress, Paper } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
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
import useConnection from '../../hooks/useConnection'
import useAssetList from '../../hooks/useAssetList'
import useWallet from '../../hooks/useWallet'
import useNotifications from '../../hooks/useNotifications'
import useOptionChain from '../../hooks/useOptionChain'
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts'

const defaultAssetPairsByNetworkName = {
  Mainnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'USDC',
  },
  Devnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: '', // TODO add this
  },
  Testnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'ABC',
  },
  localhost: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'SPL1',
  },
}

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

const formatStrike = (sp) => {
  if (sp === '--') return sp
  const str = `${sp}`
  return str.match(/\..{2,}/) ? str : parseFloat(sp).toFixed(2)
}

const next3Months = getNext3Months()
const emptyRows = Array(9).fill(rowTemplate)

const Markets = () => {
  const { endpoint } = useConnection()
  const { connect, connected } = useWallet()
  const { pushNotification } = useNotifications()

  const supportedAssets = useAssetList()
  const [date, setDate] = useState(next3Months[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [rows, setRows] = useState(emptyRows)

  const {
    initializeMarkets,
    getMarket,
    createAccountsAndMint,
  } = useOptionsMarkets()

  const ownedTokenAccounts = useOwnedTokenAccounts()

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

  const setRowloading = ({ index, type, actionInProgress }) => {
    // Set the row to loading state
    setRows(
      rows.map((row, i) => {
        if (index === i) {
          return {
            ...row,
            [type]: {
              ...row[type],
              actionInProgress,
            },
          }
        }
        return row
      }),
    )
  }

  const handleInitialize = async ({ index, type }) => {
    setRowloading({ index, type, actionInProgress: true })
    try {
      const ua = type === 'call' ? uAsset : qAsset
      const qa = type === 'call' ? qAsset : uAsset
      const row = rows[index]
      const sizeAsU64 = row.size * 10 ** ua.decimals

      await initializeMarkets({
        size: sizeAsU64,
        strikePrices: [row.strike],
        uAssetSymbol: ua.tokenSymbol,
        qAssetSymbol: qa.tokenSymbol,
        uAssetMint: ua.mintAddress,
        qAssetMint: qa.mintAddress,
        expiration: date.unix(),
      })

      const newRows = rows.map((_row, i) => {
        if (index === i) {
          return {
            ..._row,
            [type]: {
              ..._row[type],
              initialized: true,
              actionInProgress: false,
            },
          }
        }
        return _row
      })

      setRows(newRows)
    } catch (err) {
      console.log(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
      setRowloading({ index, type, actionInProgress: false })
    }
  }

  const handleMint = async ({ index, type }) => {
    setRowloading({ index, type, actionInProgress: true })
    try {
      const ua = type === 'call' ? uAsset : qAsset
      const qa = type === 'call' ? qAsset : uAsset
      const row = rows[index]

      const marketParams = {
        date: date.unix(),
        uAssetSymbol: ua.tokenSymbol,
        qAssetSymbol: qa.tokenSymbol,
        size: type === 'call' ? row.size : row.size * row.strike, // TODO -- deal with FP imprecision
        price: type === 'call' ? row.strike : 1 / row.strike, // TODO -- deal with FP imprecision
      }

      const marketData = getMarket(marketParams)
      const ownedMintedOptionAccounts =
        (marketData && ownedTokenAccounts[marketData.optionMintAddress]) || []
      const ownedUAssetAccounts =
        (uAsset && ownedTokenAccounts[uAsset.mintAddress]) || []
      const ownedQAssetAccounts =
        (qAsset && ownedTokenAccounts[qAsset.mintAddress]) || []

      await createAccountsAndMint({
        ...marketParams,
        uAssetAccount: ownedUAssetAccounts[0]?.pubKey || '',
        qAssetAccount: ownedQAssetAccounts[0]?.pubKey || '',
        ownedQAssetAccounts,
        mintedOptionAccount: ownedMintedOptionAccounts[0]?.pubKey || '',
        ownedMintedOptionAccounts,
      })

      console.log('Minted options token!')
    } catch (err) {
      console.log(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    } finally {
      setRowloading({ index, type, actionInProgress: false })
    }
  }

  return (
    <Page>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
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
                      ) : row.call?.actionInProgress ? (
                        <CircularProgress size={32} />
                      ) : !connected ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          p="8px"
                          onClick={connect}
                        >
                          Connect
                        </Button>
                      ) : row.call?.initialized ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          p="8px"
                          onClick={() =>
                            handleMint({
                              index: i,
                              type: 'call',
                            })
                          }
                        >
                          Mint
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          p="8px"
                          onClick={() =>
                            handleInitialize({
                              index: i,
                              type: 'call',
                            })
                          }
                        >
                          Initialize
                        </Button>
                      )}
                    </TCell>
                    <TCell align="left">{row.size}</TCell>
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

                    <TCell align="right">{row.size}</TCell>
                    <TCell align="right">{row.put?.bid}</TCell>
                    <TCell align="right">{row.put?.ask}</TCell>
                    <TCell align="right">{row.put?.change}</TCell>
                    <TCell align="right">{row.put?.volume}</TCell>
                    <TCell align="right">{row.put?.openInterest}</TCell>
                    <TCell align="right">
                      {row.put?.emptyRow ? (
                        '--'
                      ) : row.put?.actionInProgress ? (
                        <CircularProgress size={32} />
                      ) : !connected ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          p="8px"
                          onClick={connect}
                        >
                          Connect
                        </Button>
                      ) : row.put?.initialized ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          p="8px"
                          onClick={() =>
                            handleMint({
                              index: i,
                              type: 'put',
                            })
                          }
                        >
                          Mint
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          p="8px"
                          onClick={() =>
                            handleInitialize({
                              index: i,
                              type: 'put',
                            })
                          }
                        >
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
