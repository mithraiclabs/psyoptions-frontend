import React, { useState } from 'react'
import moment from 'moment'

import { Box, Paper, Button, Chip, TextField } from '@material-ui/core'
import Done from '@material-ui/icons/Done'
import Page from './Page'
import SelectAsset from '../SelectAsset'
import theme from '../../utils/theme'

import useWallet from '../../hooks/useWallet'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import useBonfida from '../../hooks/useBonfida'
import { generateStrikePrices } from '../../utils/generateStrikePrices'

const darkBorder = `1px solid ${theme.palette.background.main}`

const next3Months = [
  moment.utc().startOf('month').add(1, 'month'),
  moment.utc().startOf('month').add(2, 'month'),
  moment.utc().startOf('month').add(3, 'month'),
]

const InitializeMarket = () => {
  const { connect, connected } = useWallet()
  const { getMyMarkets, marketExists, initializeMarkets } = useOptionsMarkets()

  const [date, setDate] = useState(next3Months[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [size, setSize] = useState(0)
  const [priceInterval, setPriceInterval] = useState(0)

  const [success, setSuccess] = useState()
  const [initializeError, setInitializeError] = useState()

  const { currentPairPrice } = useBonfida({
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
  })

  let strikePrices = []
  if (currentPairPrice && priceInterval && !isNaN(priceInterval)) {
    strikePrices = generateStrikePrices(currentPairPrice, priceInterval)
  }

  const assetsSelected = uAsset && qAsset
  const canInitialize = !marketExists({
    date: date.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size,
    price: strikePrices[0],
  })
  const parametersValid = size && !isNaN(size) && strikePrices.length > 0

  const handleInitialize = async () => {
    setInitializeError(false)
    // TODO: initializing a single strike price at a time
    try {
      const results = await initializeMarkets({
        size,
        strikePrices,
        uAssetSymbol: uAsset.tokenSymbol,
        qAssetSymbol: qAsset.tokenSymbol,
        uAssetMint: uAsset.mintAddress,
        qAssetMint: qAsset.mintAddress,
        expiration: date.unix(),
      })
      console.log(results)
      setSuccess(true)
    } catch (err) {
      // TODO: display some meaningful error state to user
      console.log(err)
      setInitializeError(err)
      setSuccess(false)
    }
  }

  return (
    <Page>
      <Box
        display="flex"
        flexDirection={['row']}
        justifyContent={'center'}
        alignItems={'center'}
        minHeight="100%"
        margin="0 auto"
        pb={5}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          height="100%"
          width={'500px'}
          minWidth="370px"
          p={1}
        >
          <Paper style={{ width: '100%', height: '100%' }}>
            <Box p={2} textAlign="center">
              <h2 style={{ margin: '10px 0 0' }}>Initialize New Market</h2>
            </Box>

            <Box p={2} borderBottom={darkBorder}>
              Expires On:
              <Box display="flex" flexWrap="wrap">
                {next3Months.map((moment) => {
                  const label = `${moment.format('ll')}, 00:00 UTC`
                  const selected = moment === date
                  const onClick = () => setDate(moment)
                  return (
                    <Chip
                      key={label}
                      clickable
                      size="small"
                      label={label}
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
                <TextField
                  label="Contract Size"
                  variant="filled"
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  helperText={isNaN(size) ? 'Must be a number' : null}
                />
              </Box>
              <Box width={'50%'} p={2}>
                <TextField
                  label="Price Interval"
                  variant="filled"
                  onChange={(e) => setPriceInterval(parseFloat(e.target.value))}
                  helperText={isNaN(priceInterval) ? 'Must be a number' : null}
                />
              </Box>
            </Box>

            {parametersValid ? (
              <Box p={1}>
                <Box p={1}>
                  Current Price: <br />
                  {currentPairPrice} {qAsset?.tokenSymbol}/{uAsset?.tokenSymbol}
                </Box>
                <Box p={1}>
                  Strike Prices to Initialize: <br />
                  {strikePrices.map((n) => `${n.toFixed(5)} `)}
                </Box>
              </Box>
            ) : null}

            <Box p={2}>
              {canInitialize && assetsSelected && parametersValid ? (
                <Button
                  fullWidth
                  variant={'outlined'}
                  color="primary"
                  onClick={connected ? handleInitialize : connect}
                >
                  <Box py={1}>
                    {connected
                      ? 'Initialize Market'
                      : 'Connect Wallet To Initialize'}
                  </Box>
                </Button>
              ) : (
                <Button fullWidth variant={'outlined'} color="primary" disabled>
                  <Box py={1}>
                    {assetsSelected && parametersValid
                      ? `Market Already Exists`
                      : 'Enter Valid Parameters to Initialize Market'}
                  </Box>
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
        {/* {initializedDataAccounts.length ? (
          <Box p={2}>
            <Paper style={{ width: '100%', height: '100%' }}>
              <Box p={1}>
                <h2>My Initialized Markets:</h2>
              </Box>
              {initializedDataAccounts.map((account) => (
                <Box p={1} borderTop={darkBorder} key={account}>
                  {account}
                </Box>
              ))}
            </Paper>
          </Box>
        ) : null} */}
      </Box>
    </Page>
  )
}

export default InitializeMarket
