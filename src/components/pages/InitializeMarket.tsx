import React, { useState } from 'react'
import BigNumber from 'bignumber.js'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Switch from '@material-ui/core/Switch'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import CircularProgress from '@material-ui/core/CircularProgress'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from "@date-io/date-fns";
import 'date-fns'
import moment from 'moment'
import Page from './Page'
import SelectAsset from '../SelectAsset'
import theme from '../../utils/theme'
import { StyledTooltip } from './Markets/styles'

import useNotifications from '../../hooks/useNotifications'
import useWallet from '../../hooks/useWallet'
import { getStrikePrices } from '../../utils/getStrikePrices'
import useAssetList from '../../hooks/useAssetList'
import { useOptionMarket } from '../../hooks/useOptionMarket'

import ConnectButton from '../ConnectButton'
import { useInitializeMarkets } from '../../hooks/useInitializeMarkets'
import { convertStrikeToAmountsPer } from '../../utils/strikeConversions'

const darkBorder = `1px solid ${theme.palette.background.main}`

const InitializeMarket = () => {
  const { pushNotification } = useNotifications()
  const { connected } = useWallet()
  const initializeMarkets = useInitializeMarkets()
  const [multiple, setMultiple] = useState(false)
  const [basePrice, setBasePrice] = useState('0')
  const [selectorDate, setSelectorDate] = useState(moment.utc())
  const { uAsset, qAsset, setUAsset } = useAssetList()
  const [size, setSize] = useState('1')
  const [loading, setLoading] = useState(false)

  const parsedBasePrice = parseFloat(
    basePrice && basePrice.replace(/^\./, '0.'),
  )
  let strikePrices = []
  if (multiple && parsedBasePrice) {
    strikePrices = getStrikePrices(parsedBasePrice)
  } else if (parsedBasePrice) {
    strikePrices = [new BigNumber(parsedBasePrice)]
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
    date: selectorDate.unix(),
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

  const handleSelectedDateChange = (date: Date | null) => {
    console.log('date', moment.utc(date).endOf('day').toISOString())
    setSelectorDate(moment.utc(date).endOf('day'));
  };

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
        expiration: selectorDate.unix(),
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

          <Box p={2} borderBottom={darkBorder} display="flex" alignItems="center">
            Expires On:
            <Box
              display="flex"
              flexWrap="wrap"
              flexDirection="row"
              alignItems="center"
            >
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <KeyboardDatePicker
                  disablePast
                  variant="inline"
                  format="MM/dd/yyyy"
                  inputVariant="filled"
                  id="date-picker-inline"
                  label="MM/DD/YYYY"
                  value={selectorDate}
                  onChange={handleSelectedDateChange}
                  KeyboardButtonProps={{
                    'aria-label': 'change date',
                  }}
                  style={{ marginLeft: theme.spacing(4) }}
                />
              </MuiPickersUtilsProvider>
              <StyledTooltip
                title={
                  <Box p={1}>
                    All expirations occur at 23:59:59 UTC on any selected date.
                  </Box>
                }
              >
                <Box p={2}>
                  <HelpOutlineIcon />
                </Box>
              </StyledTooltip>
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
                value={size}
                label="Contract Size"
                variant="filled"
                onChange={(e) => setSize(e.target.value)}
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
              {!multiple
                ? 'Strike price will be rounded up to nearest supported price'
                : null}
            </Box>
          </Box>

          {parametersValid ? (
            <Box p={1}>
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
