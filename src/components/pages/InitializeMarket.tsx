import React, { useState } from 'react'
import BigNumber from 'bignumber.js'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import Link from '@material-ui/core/Link'
import Radio from '@material-ui/core/Radio'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import RadioGroup from '@material-ui/core/RadioGroup'
import CircularProgress from '@material-ui/core/CircularProgress'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import 'date-fns'
import moment from 'moment'
import useLocalStorageState from 'use-local-storage-state'
import Page from './Page'
import SelectAsset from '../SelectAsset'
import theme from '../../utils/theme'
import { StyledTooltip } from './Markets/styles'

import useNotifications from '../../hooks/useNotifications'
import useWallet from '../../hooks/useWallet'
import useAssetList from '../../hooks/useAssetList'
import { useOptionMarket } from '../../hooks/useOptionMarket'

import ConnectButton from '../ConnectButton'
import { useInitializeMarkets } from '../../hooks/useInitializeMarkets'
import { convertStrikeToAmountsPer } from '../../utils/strikeConversions'
import useConnection from '../../hooks/useConnection'

const darkBorder = `1px solid ${theme.palette.background.main}`

const InitializeMarket = () => {
  const { pushNotification } = useNotifications()
  const { connected } = useWallet()
  const initializeMarkets = useInitializeMarkets()
  const { endpoint } = useConnection()
  const [basePrice, setBasePrice] = useState('0')
  const [selectorDate, setSelectorDate] = useState(moment.utc().endOf('day'))
  const { uAsset, qAsset, setUAsset } = useAssetList()
  const [size, setSize] = useState('1')
  const [loading, setLoading] = useState(false)
  const [callOrPut, setCallOrPut] = useState('calls')
  const [initializedMarketMeta, setInitializedMarketMeta] =
    useLocalStorageState('initialized-markets', [])

  const parsedBasePrice = parseFloat(
    basePrice && basePrice.replace(/^\./, '0.'),
  )
  let strikePrices = []
  if (parsedBasePrice) {
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
    setSelectorDate(moment.utc(date).endOf('day'))
  }

  const handleChangeCallPut = (e) => {
    setCallOrPut(e.target.value)
  }

  const handleInitialize = async () => {
    try {
      setLoading(true)
      const ua = callOrPut === 'calls' ? uAsset : qAsset
      const qa = callOrPut === 'calls' ? qAsset : uAsset

      let amountsPerContract
      let quoteAmountsPerContract

      if (callOrPut === 'calls') {
        amountsPerContract = new BigNumber(size)
        quoteAmountsPerContract = strikePrices.map((sp) =>
          sp.multipliedBy(size),
        )
      } else {
        amountsPerContract = strikePrices[0].multipliedBy(size)
        quoteAmountsPerContract = [new BigNumber(size)]
      }

      const markets = await initializeMarkets({
        amountPerContract: amountsPerContract,
        quoteAmountsPerContract,
        uAssetSymbol: ua.tokenSymbol,
        qAssetSymbol: qa.tokenSymbol,
        uAssetMint: ua.mintAddress,
        qAssetMint: qa.mintAddress,
        uAssetDecimals: ua.decimals,
        qAssetDecimals: qa.decimals,
        expiration: selectorDate.unix(),
      })
      setLoading(false)
      setInitializedMarketMeta((prevMarketsMetaArr) => {
        const marketsMetaArr = markets.map((_market) => ({
          expiration: _market.expiration,
          optionMarketAddress: _market.optionMarketKey.toString(),
          optionContractMintAddress: _market.optionMintKey.toString(),
          optionWriterTokenMintAddress: _market.writerTokenMintKey.toString(),
          quoteAssetMint: _market.quoteAssetMintKey.toString(),
          quoteAssetPoolAddress: _market.quoteAssetPoolKey.toString(),
          underlyingAssetMint: _market.underlyingAssetMintKey.toString(),
          underlyingAssetPoolAddress: _market.underlyingAssetPoolKey.toString(),
          underlyingAssetPerContract: _market.amountPerContract
            .multipliedBy(new BigNumber(10).pow(ua.decimals))
            .toString(),
          quoteAssetPerContract: _market.quoteAmountPerContract
            .multipliedBy(new BigNumber(10).pow(qa.decimals))
            .toString(),
          // TODO serumMarketAddress:
          // TODO serumProgramId:
          psyOptionsProgramId: endpoint.programId,
        }))
        return [...prevMarketsMetaArr, ...marketsMetaArr]
      })
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
        p={[0, 0, 4]}
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

          <Box
            p={2}
            borderBottom={darkBorder}
            display="flex"
            alignItems="center"
          >
            Expires On:
            <Box
              display="flex"
              flexWrap="wrap"
              flexDirection="row"
              alignItems="center"
            >
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <KeyboardDatePicker
                  autoOk
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
                  label="Strike Price"
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
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="gender"
                  name="gender1"
                  value={callOrPut}
                  onChange={handleChangeCallPut}
                  row
                >
                  <FormControlLabel
                    value="calls"
                    control={<Radio />}
                    label="Calls"
                  />
                  <FormControlLabel
                    value="puts"
                    control={<Radio />}
                    label="Puts"
                  />
                </RadioGroup>
              </FormControl>
            </Box>
            <Box width="50%" p={2}>
              {callOrPut === 'calls'
                ? 'Initialize calls for market'
                : 'Initialize puts for market'}
            </Box>
          </Box>

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
      {initializedMarketMeta.length > 0 && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          minHeight="100%"
          width="100%"
          pt={0}
        >
          <Paper
            style={{ width: '100%', maxWidth: '500px', alignItems: 'center' }}
          >
            <Box
              display="flex"
              flex="1"
              alignItems="center"
              justifyContent="space-between"
              p={1}
            >
              <Box px={1}>
                <h3>Initialized Market Data</h3>
              </Box>
              <Box p={1} minWidth={'120px'}>
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={() => setInitializedMarketMeta([])}
                >
                  Clear data
                </Button>
              </Box>
            </Box>
            <Box display="flex">
              <Box fontSize={'12px'}>
                <Box p={1}>
                  Data from markets previously initialized by your browser in
                  JSON format appears here.
                </Box>
                <Box p={1} pt={0} display="block">
                  After initializing a market, you may submit a pull request to
                  our{' '}
                  <Link href="https://github.com/mithraiclabs/psyoptions-ts/tree/master/packages/market-meta">
                    market meta package
                  </Link>{' '}
                  for UI support.
                </Box>
              </Box>
            </Box>
            <Box p={2}>
              <TextareaAutosize
                value={JSON.stringify(initializedMarketMeta, null, 4)}
                style={{
                  padding: '16px',
                  border: `1px solid ${theme.palette.primary.light}`,
                  color: theme.palette.primary.main,
                  background: 'rgba(255,255,255,0.1)',
                  width: '100%',
                }}
              />
            </Box>
          </Paper>
        </Box>
      )}
    </Page>
  )
}

export default InitializeMarket
