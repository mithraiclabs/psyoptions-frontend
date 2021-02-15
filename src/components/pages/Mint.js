import { Box, Paper, Button, Chip } from '@material-ui/core'
import React, { useState } from 'react'
import Done from '@material-ui/icons/Done'

import theme from '../../utils/theme'

import useWallet from '../../hooks/useWallet'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'

import SelectAsset from '../SelectAsset'
import Page from './Page'
import Select from '../Select'

const darkBorder = `1px solid ${theme.palette.background.main}`

const Mint = () => {
  const { connect, connected, loading } = useWallet()
  const {
    marketExists,
    getMarketAddress,
    getStrikePrices,
    getDates,
  } = useOptionsMarkets()

  const dates = getDates()

  const [date, setDate] = useState(dates[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [size, setSize] = useState(100)
  const [price, setPrice] = useState(0)

  const allParams = {
    date,
    uAssetSymbol: uAsset?.symbol,
    qAssetSymbol: qAsset?.symbol,
    size,
    price,
  }

  // marketStatus returns e.g. { date: true, pair: true, size: false, price: true }
  const marketStatus = marketExists(allParams)
  const strikePrices = getStrikePrices(allParams)
  const marketAddress = getMarketAddress(allParams)

  // TODO: check if connected wallet has enough of uAsset
  // TODO: set canMint to true if all conditions are met (params set, has UA funds, etc)
  const canMint = !!marketAddress

  const handleMint = () => {
    // TODO: make "useTransactionInstructions" hook that sends out transactions here
    // Then call the mint one here
  }

  return (
    <Page>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        height="100%"
        minHeight="500px"
        pb={4}
      >
        <Paper
          style={{
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <Box>
            <Box p={2} textAlign="center">
              <h2 style={{ margin: '10px 0 0' }}>Contract Settings</h2>
            </Box>

            <Box p={2} borderBottom={darkBorder}>
              Expires On:
              <Box display="flex" flexWrap="wrap">
                {dates.map((d) => {
                  const selected = d === date
                  const onClick = () => setDate(d)
                  return (
                    <Chip
                      key={d}
                      clickable
                      size="small"
                      label={d}
                      color="primary"
                      onClick={onClick}
                      onDelete={selected ? onClick : undefined}
                      deleteIcon={selected ? <Done /> : undefined}
                      variant={selected ? undefined : 'outlined'}
                      style={{
                        marginTop: theme.spacing(2),
                        marginRight: theme.spacing(2),
                      }}
                    />
                  )
                })}
              </Box>
            </Box>

            <Box display="flex" borderBottom={darkBorder}>
              <Box width={'50%'} p={2} borderRight={darkBorder}>
                Underlying Asset:
                <Box mt={2}>
                  <SelectAsset
                    selectedAsset={uAsset}
                    onSelectAsset={setUAsset}
                  />
                </Box>
              </Box>

              <Box width={'50%'} p={2}>
                Quote Asset:
                <Box mt={2}>
                  <SelectAsset
                    selectedAsset={qAsset}
                    onSelectAsset={setQAsset}
                  />
                </Box>
              </Box>
            </Box>

            <Box display="flex" borderBottom={darkBorder}>
              <Box width={'50%'} p={2} borderRight={darkBorder}>
                <Select
                  variant="filled"
                  label={'Contract Size'}
                  disabled={marketStatus.pair === false}
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  options={[1, 100]}
                  style={{
                    width: '100%',
                  }}
                />
              </Box>

              <Box width={'50%'} p={2}>
                <Select
                  variant="filled"
                  label={'Strike Price'}
                  disabled={marketStatus.size === false}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  options={strikePrices}
                  style={{
                    width: '100%',
                  }}
                />
              </Box>
            </Box>

            {uAsset && qAsset && (
              <Box p={2}>
                {marketStatus.pair
                  ? 'This pair can be minted'
                  : `${uAsset.symbol}/${qAsset.symbol} Market doesn't exist yet. Creating new markets from the UI is coming soon!`}
              </Box>
            )}

            <Box p={2}>
              {!connected && (
                <Button
                  fullWidth
                  variant={'outlined'}
                  color="primary"
                  onClick={connect}
                >
                  <Box py={1}>Connect Wallet To Mint</Box>
                </Button>
              )}

              {connected && (
                <Button
                  fullWidth
                  variant={'outlined'}
                  color="primary"
                  disabled={!canMint}
                  onClick={canMint ? handleMint : null}
                >
                  <Box py={1}>
                    {marketAddress
                      ? `
                    Mint (${size} ${uAsset?.symbol} @ ${price} ${qAsset?.symbol}/${uAsset?.symbol})`
                      : `Select Parameters to Mint`}
                  </Box>
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Page>
  )
}

export default Mint
