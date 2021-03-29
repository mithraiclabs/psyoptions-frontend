import React, { useEffect, useState, useMemo } from 'react'
import Done from '@material-ui/icons/Done'
import { Box, Paper, Button, Chip, CircularProgress } from '@material-ui/core'
import * as Sentry from '@sentry/react'

import SelectAsset from '../SelectAsset'
import Page from './Page'
import Select from '../Select'

import theme from '../../utils/theme'
import { truncatePublicKey } from '../../utils/format'
import { getLastFridayOfMonths } from '../../utils/dates'

import useWallet from '../../hooks/useWallet'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../hooks/useNotifications'
import useAssetList from '../../hooks/useAssetList'

const darkBorder = `1px solid ${theme.palette.background.main}`

const expirations = getLastFridayOfMonths(10)

const Mint = () => {
  const { pushNotification } = useNotifications()
  const { connect, connected } = useWallet()
  const {
    getMarket,
    getStrikePrices,
    getSizes,
    createAccountsAndMint,
    fetchMarketData,
  } = useOptionsMarkets()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()

  const dates = expirations

  const [date, setDate] = useState(dates[0])
  const { uAsset, qAsset, setUAsset } = useAssetList()
  const [size, setSize] = useState(100)
  const [price, setPrice] = useState('')
  const [uAssetAccount, setUAssetAccount] = useState('')
  const [qAssetAccount, setQAssetAccount] = useState('')
  const [mintedOptionAccount, setMintedOptionAccount] = useState('')
  const [mintedWriterTokenDestKey, setMintedWriterTokenDestKey] = useState('')
  const [loading, setLoading] = useState(false)

  const allParams = {
    date: date.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size,
    price,
  }

  const contractSizes = getSizes(allParams)
  const strikePrices = getStrikePrices(allParams).sort((a, b) => a - b)
  const marketData = getMarket(allParams)

  const ownedUAssetAccounts = useMemo(
    () => (uAsset && ownedTokenAccounts[uAsset.mintAddress]) || [],
    [uAsset, ownedTokenAccounts],
  )
  const ownedQAssetAccounts = useMemo(
    () => (qAsset && ownedTokenAccounts[qAsset.mintAddress]) || [],
    [qAsset, ownedTokenAccounts],
  )
  const ownedMintedOptionAccounts = useMemo(
    () =>
      (marketData && ownedTokenAccounts[marketData.optionMintAddress]) || [],
    [marketData, ownedTokenAccounts],
  )
  const ownedWriterTokenMintAccounts = useMemo(
    () =>
      (marketData && ownedTokenAccounts[marketData.writerTokenMintKey]) || [],
    [marketData, ownedTokenAccounts],
  )

  useEffect(() => {
    fetchMarketData()
  }, [fetchMarketData])

  useEffect(() => {
    setUAssetAccount(ownedUAssetAccounts[0]?.pubKey || '')
  }, [ownedUAssetAccounts])

  useEffect(() => {
    setQAssetAccount(ownedQAssetAccounts[0]?.pubKey || '')
  }, [ownedQAssetAccounts])

  useEffect(() => {
    setMintedOptionAccount(ownedMintedOptionAccounts[0]?.pubKey || '')
  }, [ownedMintedOptionAccounts])

  useEffect(() => {
    setMintedWriterTokenDestKey(ownedWriterTokenMintAccounts[0]?.pubKey || '')
  }, [ownedWriterTokenMintAccounts])

  const handleMint = async () => {
    setLoading(true)
    try {
      await createAccountsAndMint({
        date: date.unix(),
        uAsset,
        qAsset,
        size,
        price,
        uAssetAccount,
        qAssetAccount,
        ownedUAssetAccounts,
        ownedQAssetAccounts,
        mintedOptionAccount,
        ownedMintedOptionAccounts,
        mintedWriterTokenDestKey,
      })
      setLoading(false)
    } catch (err) {
      setLoading(false)
      console.log(err)
      Sentry.captureException(err)
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
          <Box>
            <Box p={2} textAlign="center">
              <h2 style={{ margin: '10px 0 0' }}>Mint Options Contract</h2>
            </Box>

            <Box p={2} borderBottom={darkBorder}>
              Expires On:
              <Box display="flex" flexWrap="wrap">
                {expirations.map((moment) => {
                  const label = `${moment.format('ll')}`
                  const selected = moment === date
                  const onClick = () => {
                    setDate(moment)
                    setPrice('')
                  }
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
                <Box my={2}>
                  <SelectAsset
                    selectedAsset={uAsset}
                    onSelectAsset={(asset) => {
                      setUAsset(asset)
                      setPrice('')
                    }}
                  />
                </Box>
                {ownedUAssetAccounts.length > 1 ? (
                  <Select
                    variant="filled"
                    label="Account"
                    value={uAssetAccount}
                    onChange={(e) => setUAssetAccount(e.target.value)}
                    options={ownedUAssetAccounts.map((acct) => ({
                      value: acct.pubKey,
                      text: `${truncatePublicKey(acct.pubKey)} (${
                        acct.amount
                      } ${uAsset?.tokenSymbol})`,
                    }))}
                    style={{
                      minWidth: '100%',
                    }}
                  />
                ) : null}
              </Box>

              <Box width="50%" p={2}>
                Quote Asset:
                <Box my={2}>
                  <SelectAsset selectedAsset={qAsset} disabled />
                </Box>
                {ownedQAssetAccounts.length > 1 ? (
                  <Select
                    variant="filled"
                    label="Account"
                    value={qAssetAccount}
                    onChange={(e) => setQAssetAccount(e.target.value)}
                    options={ownedQAssetAccounts.map((account) => ({
                      value: account.pubKey,
                      text: `${account.pubKey.slice(
                        0,
                        3,
                      )}...${account.pubKey.slice(
                        account.pubKey.length - 3,
                        account.pubKey.length,
                      )} (${account.amount} ${qAsset?.tokenSymbol})`,
                    }))}
                    style={{
                      minWidth: '100%',
                    }}
                  />
                ) : null}
              </Box>
            </Box>

            <Box display="flex" borderBottom={darkBorder}>
              <Box width="50%" p={2} borderRight={darkBorder}>
                <Select
                  variant="filled"
                  label="Contract Size"
                  value={contractSizes.length ? size : ''}
                  onChange={(e) => {
                    setPrice('')
                    setSize(e.target.value)
                  }}
                  disabled={contractSizes.length === 0}
                  options={contractSizes.map((s) => ({
                    value: s,
                    text: `${s}`,
                  }))}
                  style={{
                    width: '100%',
                  }}
                />
              </Box>

              <Box width="50%" p={2}>
                <Select
                  variant="filled"
                  label="Strike Price"
                  value={strikePrices.length ? price : ''}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={strikePrices.length === 0}
                  options={strikePrices.map((s) => ({
                    value: s,
                    text: `${s} ${qAsset.tokenSymbol}/${uAsset.tokenSymbol}`,
                  }))}
                  style={{
                    width: '100%',
                  }}
                />
              </Box>
            </Box>

            {uAsset && qAsset ? (
              contractSizes.length && strikePrices.length ? (
                <Box p={2}>This contract can be minted</Box>
              ) : (
                <Box p={2}>
                  This market doesn&apos;t exist yet. Creating new markets from
                  the UI is coming soon!
                </Box>
              )
            ) : null}

            <Box p={2}>
              {loading ? (
                <Box display="flex" justifyContent="center">
                  <CircularProgress />
                </Box>
              ) : marketData ? (
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={connected ? handleMint : connect}
                >
                  <Box py={1}>
                    {connected
                      ? `Mint (${size} ${uAsset?.tokenSymbol} @ ${price} ${qAsset?.tokenSymbol}/${uAsset?.tokenSymbol})`
                      : 'Connect Wallet To Mint'}
                  </Box>
                </Button>
              ) : (
                <Button fullWidth variant="outlined" color="primary" disabled>
                  <Box py={1}>Select Parameters to Mint</Box>
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
