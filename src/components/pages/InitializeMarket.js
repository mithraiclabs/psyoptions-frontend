import React, { useEffect, useState } from 'react'
import moment from 'moment'

import { Box, Paper, Button, Chip, TextField } from '@material-ui/core'
import Done from '@material-ui/icons/Done'

import theme from '../../utils/theme'
import useWallet from '../../hooks/useWallet'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import Page from './Page'
import SelectAsset from '../SelectAsset'
import Select from '../Select'
import ExistingMarkets from '../ExistingMarkets'

import useBonfida from '../../hooks/useBonfida'
import { generateStrikePrices } from '../../utils/generateStrikePrices'

const darkBorder = `1px solid ${theme.palette.background.main}`

const next3Months = [
  moment.utc().startOf('month').add(1, 'month'),
  moment.utc().startOf('month').add(2, 'month'),
  moment.utc().startOf('month').add(3, 'month'),
]

const InitializeMarket = () => {
  const { connect, connected, loading } = useWallet()

  const { marketExists } = useOptionsMarkets()

  const [date, setDate] = useState(next3Months[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [size, setSize] = useState(0)
  const [priceInterval, setPriceInterval] = useState(0)

  const allParams = {
    date: date.unix(),
    uAssetSymbol: uAsset?.symbol,
    qAssetSymbol: qAsset?.symbol,
    size,
  }

  const { currentPairPrice } = useBonfida({
    uAssetSymbol: uAsset?.symbol,
    qAssetSymbol: qAsset?.symbol,
  })

  let strikePrices = []
  if (currentPairPrice && priceInterval && !isNaN(priceInterval)) {
    strikePrices = generateStrikePrices(currentPairPrice, priceInterval)
  }

  const marketStatus = marketExists(allParams)
  const assetsSelected = uAsset && qAsset
  const canInitialize = !marketStatus.size
  const parametersValid = size && !isNaN(size) && strikePrices.length > 0

  const handleInitialize = () => {
    console.log('Initialize')
    console.log('all params: ', {
      uAsset,
      qAsset,
      size,
      date: date.unix(),
      strikePrices,
    })
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
        {/* <Box width={'100%'} minWidth="320px" height="100%" p={1}>
          <Paper>
            <ExistingMarkets date={date} />
          </Paper>
        </Box> */}
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
                {/* <Select
                  variant="filled"
                  label={'Contract Size'}
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  options={[1, 10, 100]}
                  style={{
                    width: '100%',
                  }}
                /> */}
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
                  {currentPairPrice} {qAsset?.symbol}/{uAsset?.symbol}
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
      </Box>
    </Page>
  )
}

export default InitializeMarket
