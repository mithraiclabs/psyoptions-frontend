import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

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
import { getLastFridayOfMonths } from '../../utils/dates'
import useAssetList from '../../hooks/useAssetList'
import { useOptionMarket } from '../../hooks/useOptionMarket';

const darkBorder = `1px solid ${theme.palette.background.main}`

const expirations = getLastFridayOfMonths(10)

const InitializeMarket = () => {
  const { pushNotification } = useNotifications()
  const { connect, connected } = useWallet()
  const { initializeMarkets } = useOptionsMarkets()
  const [multiple, setMultiple] = useState(false)
  const [basePrice, setBasePrice] = useState(0)
  const [date, setDate] = useState(expirations[0])
  const { uAsset, qAsset, setUAsset } = useAssetList()
  const [size, setSize] = useState(0)
  const [priceInterval, setPriceInterval] = useState(0)
  const { marketPrice } = useSerumMarketInfo({
    uAssetMint: uAsset?.mintAddress,
    qAssetMint: qAsset?.mintAddress,
  })
  const [loading, setLoading] = useState(false)

  const parsedBasePrice = parseFloat(
    basePrice && basePrice.replace(/^\./, '0.'),
  )
  let strikePrices = []
  if (
    multiple &&
    (parsedBasePrice || marketPrice) &&
    priceInterval &&
    !Number.isNaN(priceInterval)
  ) {
    strikePrices = generateStrikePrices(
      parsedBasePrice || marketPrice,
      priceInterval,
    )
  } else if (parsedBasePrice || marketPrice) {
    strikePrices = [parsedBasePrice || marketPrice]
  }
  const market = useOptionMarket({
    date: date.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size,
    price: strikePrices[0],
  })
  const canInitialize = !market;

  const assetsSelected = uAsset && qAsset
  const parametersValid = size && !Number.isNaN(size) && strikePrices.length > 0

  const handleChangeBasePrice = (e) => {
    const input = e.target.value || ''
    setBasePrice(input)
  }

  const handleInitialize = async () => {
    try {
      setLoading(true)
      await initializeMarkets({
        amountPerContract: new BigNumber(size),
        quoteAmountsPerContract: strikePrices.map((sp) =>
          new BigNumber(sp).multipliedBy(size),
        ),
        uAssetSymbol: uAsset.tokenSymbol,
        qAssetSymbol: qAsset.tokenSymbol,
        uAssetMint: uAsset.mintAddress,
        qAssetMint: qAsset.mintAddress,
        uAssetDecimals: uAsset.decimals,
        qAssetDecimals: uAsset.decimals,
        expiration: date.unix(),
      })
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
              {expirations.map((moment) => {
                const label = `${moment.format('ll')}`
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
            <Box width="50%" p={2} borderRight={darkBorder}>
              Underlying Asset:
              <Box mt={2}>
                <SelectAsset
                  selectedAsset={uAsset}
                  onSelectAsset={(asset) => {
                    setUAsset(asset)
                  }}
                />
              </Box>
            </Box>

            <Box width="50%" p={2}>
              Quote Asset:
              <Box mt={2}>
                <SelectAsset selectedAsset={qAsset} disabled />
              </Box>
            </Box>
          </Box>

          <Box display="flex" borderBottom={darkBorder}>
            <Box width="50%" p={2} borderRight={darkBorder}>
              <TextField
                label="Contract Size"
                variant="filled"
                onChange={(e) => setSize(parseInt(e.target.value, 10))}
                helperText={Number.isNaN(size) ? 'Must be a number' : null}
              />
            </Box>
            <Box width="50%" p={2}>
              <Box pb={2}>
                <TextField
                  value={basePrice}
                  label="Base Price"
                  variant="filled"
                  onChange={handleChangeBasePrice}
                  helperText={
                    Number.isNaN(parsedBasePrice) ? 'Must be a number' : null
                  }
                />
              </Box>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" borderBottom={darkBorder}>
            <Box width="50%" p={2}>
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
            <Box width="50%" p={2}>
              {multiple ? (
                <TextField
                  label="Price Interval"
                  variant="filled"
                  onChange={(e) => setPriceInterval(parseFloat(e.target.value))}
                  helperText={
                    Number.isNaN(priceInterval) ? 'Must be a number' : null
                  }
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
                {strikePrices.map((n) => `${n.toFixed(qAsset.decimals)} `)}
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
                variant="outlined"
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
              <Button fullWidth variant="outlined" color="primary" disabled>
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
