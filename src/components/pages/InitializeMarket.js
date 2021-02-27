import React, { useState } from 'react'
import moment from 'moment'

import {
  Box,
  Paper,
  Button,
  Chip,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@material-ui/core'
import Done from '@material-ui/icons/Done'
import Page from './Page'
import SelectAsset from '../SelectAsset'
import theme from '../../utils/theme'

import useNotifications from '../../hooks/useNotifications'
import useWallet from '../../hooks/useWallet'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import useSerumMarketInfo from '../../hooks/useSerumMarketInfo'
import { generateStrikePrices } from '../../utils/generateStrikePrices'
import { getNext3Months } from '../../utils/dates'

const darkBorder = `1px solid ${theme.palette.background.main}`

const next3Months = getNext3Months()

const InitializeMarket = () => {
  const { pushNotification } = useNotifications()
  const { connect, connected } = useWallet()
  const { getMyMarkets, getMarket, initializeMarkets } = useOptionsMarkets()

  const [multiple, setMultiple] = useState(false)
  const [basePrice, setBasePrice] = useState(0)
  const [date, setDate] = useState(next3Months[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [size, setSize] = useState(0)
  const [priceInterval, setPriceInterval] = useState(0)
  const { marketPrice } = useSerumMarketInfo({
    uAssetMint: uAsset?.mintAddress,
    qAssetMint: qAsset?.mintAddress,
  })
  const [loading, setLoading] = useState(false)

  const parsedBasePrice = parseInt(basePrice)
  let strikePrices = []
  if (
    multiple &&
    (parsedBasePrice || marketPrice) &&
    priceInterval &&
    !isNaN(priceInterval)
  ) {
    strikePrices = generateStrikePrices(
      parsedBasePrice || marketPrice,
      priceInterval
    )
  } else if (parsedBasePrice || marketPrice) {
    strikePrices = [parsedBasePrice || marketPrice]
  }

  const assetsSelected = uAsset && qAsset
  const canInitialize = !getMarket({
    date: date.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size,
    price: strikePrices[0],
  })
  const parametersValid = size && !isNaN(size) && strikePrices.length > 0

  const handleInitialize = async () => {
    // The size must account for the number of decimals the underlying SPL Token has.
    const sizeAsU64 = size * 10 ** uAsset.decimals

    try {
      setLoading(true)
      const results = await initializeMarkets({
        size: sizeAsU64,
        strikePrices,
        uAssetSymbol: uAsset.tokenSymbol,
        qAssetSymbol: qAsset.tokenSymbol,
        uAssetMint: uAsset.mintAddress,
        qAssetMint: qAsset.mintAddress,
        expiration: date.unix(),
      })
      console.log(results)
      setLoading(false)
    } catch (err) {
      setLoading(false)
      // TODO: display some meaningful error state to user
      console.log(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
  }

  return (
    <Page>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={[0, 0, 4]}
      >
        <Paper
          style={{
            width: '100%',
            maxWidth: '500px',
          }}
        >
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
                <SelectAsset selectedAsset={uAsset} onSelectAsset={setUAsset} />
              </Box>
            </Box>

            <Box width={'50%'} p={2}>
              Quote Asset:
              <Box mt={2}>
                <SelectAsset selectedAsset={qAsset} onSelectAsset={setQAsset} />
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
              <Box pb={2}>
                <TextField
                  value={basePrice}
                  label="Base Price"
                  variant="filled"
                  onChange={(e) => setBasePrice(e.target.value)}
                  helperText={
                    isNaN(parsedBasePrice) ? 'Must be a number' : null
                  }
                />
              </Box>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" borderBottom={darkBorder}>
            <Box width={'50%'} p={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={multiple}
                    onChange={() => setMultiple(!multiple)}
                    name="multiple"
                    color="secondary"
                  />
                }
                label="Multi Strikes"
              />
            </Box>
            <Box width={'50%'} p={2}>
              {multiple ? (
                <TextField
                  label="Price Interval"
                  variant="filled"
                  onChange={(e) => setPriceInterval(parseFloat(e.target.value))}
                  helperText={isNaN(priceInterval) ? 'Must be a number' : null}
                />
              ) : null}
            </Box>
          </Box>

          {parametersValid ? (
            <Box p={1}>
              {marketPrice ? (
                <Box p={1}>
                  Current Market Price: <br />
                  {marketPrice} {qAsset?.tokenSymbol}/{uAsset?.tokenSymbol}
                </Box>
              ) : null}
              <Box p={1}>
                Strike Prices to Initialize: <br />
                {strikePrices.map((n) => `${n.toFixed(5)} `)}
              </Box>
            </Box>
          ) : null}

          <Box p={2}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={1}>
                <CircularProgress />
              </Box>
            ) : canInitialize && assetsSelected && parametersValid ? (
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
    </Page>
  )
}

export default InitializeMarket
