import React, { useState } from 'react'
import BigNumber from 'bignumber.js'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import Chip from '@material-ui/core/Chip'
import TextField from '@material-ui/core/TextField'
import Switch from '@material-ui/core/Switch'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import CircularProgress from '@material-ui/core/CircularProgress'
import NoSsr from '@material-ui/core/NoSsr'
import Done from '@material-ui/icons/Done'
import Page from './Page'
import SelectAsset from '../SelectAsset'
import theme from '../../utils/theme'

import useNotifications from '../../hooks/useNotifications'
import useWallet from '../../hooks/useWallet'
import useSerumMarketInfo from '../../hooks/useSerumMarketInfo'
import { getStrikePrices } from '../../utils/getStrikePrices'
import useExpirationDate from '../../hooks/useExpirationDate'
import useAssetList from '../../hooks/useAssetList'
import { useOptionMarket } from '../../hooks/useOptionMarket'

import ConnectButton from '../ConnectButton'
import { ContractSizeSelector } from '../ContractSizeSelector'
import { useInitializeMarkets } from '../../hooks/useInitializeMarkets'
import { convertStrikeToAmountsPer } from '../../utils/strikeConversions'

const darkBorder = `1px solid ${theme.palette.background.main}`

const InitializeMarket = () => {
  const { pushNotification } = useNotifications()
  const { connected } = useWallet()
  const initializeMarkets = useInitializeMarkets()
  const [multiple, setMultiple] = useState(false)
  const [basePrice, setBasePrice] = useState('0')
  const { selectedDate, setSelectedDate, dates } = useExpirationDate()
  const { uAsset, qAsset, setUAsset } = useAssetList()
  const [size, setSize] = useState('1')
  const { marketPrice } = useSerumMarketInfo({
    uAssetMint: uAsset?.mintAddress,
    qAssetMint: qAsset?.mintAddress,
  })
  const [loading, setLoading] = useState(false)

  const parsedBasePrice = parseFloat(
    basePrice && basePrice.replace(/^\./, '0.'),
  )
  let strikePrices = []
  if (multiple && (parsedBasePrice || marketPrice)) {
    strikePrices = getStrikePrices(parsedBasePrice || marketPrice)
  } else if (parsedBasePrice || marketPrice) {
    strikePrices = getStrikePrices(parsedBasePrice || marketPrice, 1, 0)
  }

  const underlyingDecimalFactor = new BigNumber(10).pow(
    new BigNumber(uAsset?.decimals),
  )
  const amountPerContract = new BigNumber(size).multipliedBy(
    underlyingDecimalFactor,
  )
  let quoteAmountPerContract
  if (strikePrices[0]) {
    quoteAmountPerContract = convertStrikeToAmountsPer(
      strikePrices[0],
      amountPerContract,
      uAsset,
      qAsset,
    )
  }
  const market = useOptionMarket({
    date: selectedDate.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size,
    amountPerContract,
    quoteAmountPerContract,
  })
  const canInitialize = !market

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
          sp.multipliedBy(size),
        ),
        uAssetSymbol: uAsset.tokenSymbol,
        qAssetSymbol: qAsset.tokenSymbol,
        uAssetMint: uAsset.mintAddress,
        qAssetMint: qAsset.mintAddress,
        uAssetDecimals: uAsset.decimals,
        qAssetDecimals: qAsset.decimals,
        expiration: selectedDate.unix(),
      })
      setLoading(false)
    } catch (err) {
      setLoading(false)
      // TODO: display some meaningful error state to user
      console.error(err)
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
              <NoSsr>
                {dates.map((d) => {
                  const label = `${d.format('ll')}`
                  const selected =
                    d.toISOString() === selectedDate.toISOString()
                  const onClick = () => setSelectedDate(d)
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
              </NoSsr>
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
              <ContractSizeSelector
                onChange={(e) => setSize(e.target.value)}
                value={size}
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
              {!multiple
                ? 'Strike price will be rounded up to nearest supported price'
                : null}
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
                {strikePrices.map((n, i) => (i === 0 ? `${n}` : `, ${n}`))}
              </Box>
            </Box>
          ) : null}

          <Box p={2}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={1}>
                <CircularProgress />
              </Box>
            ) : canInitialize && assetsSelected && parametersValid ? (
              <>
                {!connected ? (
                  <ConnectButton fullWidth>
                    <Box py={1}>Connect Wallet To Initialize</Box>
                  </ConnectButton>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    onClick={handleInitialize}
                  >
                    <Box py={1}>Initialize Market</Box>
                  </Button>
                )}
              </>
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
