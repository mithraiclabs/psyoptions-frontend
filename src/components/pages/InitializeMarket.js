import React, { useState } from 'react'
import moment from 'moment'

import { Box, Paper, Button, Chip, TextField } from '@material-ui/core'
import Done from '@material-ui/icons/Done'

import theme from '../../utils/theme'
import useWallet from '../../hooks/useWallet'
import useConnection from '../../hooks/useConnection'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import Page from './Page'
import SelectAsset from '../SelectAsset'

import useBonfida from '../../hooks/useBonfida'
import { generateStrikePrices } from '../../utils/generateStrikePrices'

import { initializeMarket } from '@mithraic-labs/options-js-bindings'
import useLocalStorageState from 'use-local-storage-state'

const darkBorder = `1px solid ${theme.palette.background.main}`

const next3Months = [
  moment.utc().startOf('month').add(1, 'month'),
  moment.utc().startOf('month').add(2, 'month'),
  moment.utc().startOf('month').add(3, 'month'),
]

const InitializeMarket = () => {
  const { connect, wallet, connected, pubKey, loading } = useWallet()
  const { connection, endpoint } = useConnection()

  const { marketExists } = useOptionsMarkets()

  const [date, setDate] = useState(next3Months[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [size, setSize] = useState(0)
  const [priceInterval, setPriceInterval] = useState(0)

  const [success, setSuccess] = useState()
  const [initializeError, setInitializeError] = useState()

  // Keep initialized data accounts in local storage for user to see them later
  // May want to store these in the backend attached to the initializer's public key
  // So that they can be queried from a 'info' page
  const [
    initializedDataAccounts,
    setInitializedDataAccounts,
  ] = useLocalStorageState('initializedDataAccount', [])

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

  const handleInitialize = async () => {
    setInitializeError(false)

    // TBD: Do we want to do all 9 strike prices in one go here?
    // If we ever make this public it should be an optional to generate all of them or just one
    try {
      // TODO: maybe move this to a hook or helper file
      const results = await Promise.all(
        strikePrices.map(async (strikePrice) => {
          const {
            signers,
            transaction,
            optionMarketDataAddress,
          } = await initializeMarket(
            connection,
            { publicKey: pubKey },
            endpoint.programId,
            uAsset.mint,
            qAsset.mint,
            size,
            strikePrice,
            date.unix()
          )

          // Next 4 lines could be moved into the initializeMarket function
          transaction.feePayer = pubKey
          const { blockhash } = await connection.getRecentBlockhash()
          transaction.recentBlockhash = blockhash
          transaction.partialSign(...signers.slice(1))

          // These have to remain in the FE app to connect to the wallet:
          const signed = await wallet.signTransaction(transaction)
          const txid = await connection.sendRawTransaction(signed.serialize())

          // TODO: push "toast notifications" here that tx started and set a loading state
          console.log(
            'Submitted transaction ' + txid + ', awaiting confirmation'
          )

          await connection.confirmTransaction(txid, 1)

          // TODO: push "toast notifications" here that tx completed and set loading state to false
          console.log('Confirmed')
          console.log({ optionMarketDataAddress })

          return optionMarketDataAddress.toString()
        })
      )

      console.log(results)

      // Don't remove previously initialized data accounts, leave them in the UI for user to see any time
      setInitializedDataAccounts(results)
      setSuccess(true)
    } catch (err) {
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
        {initializedDataAccounts.length && (
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
        )}
      </Box>
    </Page>
  )
}

export default InitializeMarket
