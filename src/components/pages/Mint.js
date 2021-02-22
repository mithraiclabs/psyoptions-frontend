import React, { useEffect, useState } from 'react'
import moment from 'moment'
import Done from '@material-ui/icons/Done'
import { Box, Paper, Button, Chip, ownerDocument } from '@material-ui/core'

import theme from '../../utils/theme'

import useWallet from '../../hooks/useWallet'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts'

import SelectAsset from '../SelectAsset'
import Page from './Page'
import Select from '../Select'

const darkBorder = `1px solid ${theme.palette.background.main}`

const next3Months = [
  moment.utc().startOf('month').add(1, 'month'),
  moment.utc().startOf('month').add(2, 'month'),
  moment.utc().startOf('month').add(3, 'month'),
]

const Mint = () => {
  const { connect, connected, wallet, pubKey, loading } = useWallet()
  const { getMarket, getStrikePrices, getSizes, mint } = useOptionsMarkets()
  const ownedTokenAccounts = useOwnedTokenAccounts()

  const dates = next3Months

  const [date, setDate] = useState(dates[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [size, setSize] = useState(100)
  const [price, setPrice] = useState(0)
  // console.log(ownedTokenAccounts)

  const ownedUAssetAccounts =
    (uAsset && ownedTokenAccounts[uAsset.mintAddress]) || []
  const ownedQAssetAccounts =
    (qAsset && ownedTokenAccounts[qAsset.mintAddress]) || []

  const [uAssetAccount, setUAssetAccount] = useState('')
  const [qAssetAccount, setQAssetAccount] = useState('')

  useEffect(() => {
    setUAssetAccount(ownedUAssetAccounts[0]?.pubKey || '')
  }, [ownedUAssetAccounts])

  useEffect(() => {
    setQAssetAccount(ownedQAssetAccounts[0]?.pubKey || '')
  }, [ownedQAssetAccounts])

  const allParams = {
    date: date.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size,
    price,
  }

  const contractSizes = getSizes(allParams)
  const strikePrices = getStrikePrices(allParams)
  const marketData = getMarket(allParams)

  const handleMint = async () => {
    console.log({
      uAssetAccount,
      qAssetAccount,
    })
    return
    try {
      await mint({
        marketData,
      })
    } catch (err) {
      console.log(err)
    }
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
                <Box my={2}>
                  <SelectAsset
                    selectedAsset={uAsset}
                    onSelectAsset={setUAsset}
                  />
                </Box>
                <Select
                  variant="filled"
                  label={'Account'}
                  value={uAssetAccount}
                  onChange={(e) => setUAssetAccount(e.target.value)}
                  disabled={ownedUAssetAccounts.length === 0}
                  options={ownedUAssetAccounts.map((account) => ({
                    value: account.pubKey,
                    text: `${account.pubKey.slice(
                      0,
                      3
                    )}...${account.pubKey.slice(
                      account.pubKey.length - 3,
                      account.pubKey.length
                    )} (${account.amount} ${uAsset?.tokenSymbol})`,
                  }))}
                  style={{
                    minWidth: '100%',
                  }}
                />
              </Box>

              <Box width={'50%'} p={2}>
                Quote Asset:
                <Box my={2}>
                  <SelectAsset
                    selectedAsset={qAsset}
                    onSelectAsset={setQAsset}
                  />
                </Box>
                <Select
                  variant="filled"
                  label={'Account'}
                  value={qAssetAccount}
                  onChange={(e) => setQAssetAccount(e.target.value)}
                  disabled={ownedQAssetAccounts.length === 0}
                  options={ownedQAssetAccounts.map((account) => ({
                    value: account.pubKey,
                    text: `${account.pubKey.slice(
                      0,
                      3
                    )}...${account.pubKey.slice(
                      account.pubKey.length - 3,
                      account.pubKey.length
                    )} (${account.amount} ${qAsset?.tokenSymbol})`,
                  }))}
                  style={{
                    minWidth: '100%',
                  }}
                />
              </Box>
            </Box>

            <Box display="flex" borderBottom={darkBorder}>
              <Box width={'50%'} p={2} borderRight={darkBorder}>
                <Select
                  variant="filled"
                  label={'Contract Size'}
                  value={contractSizes.length ? size : ''}
                  onChange={(e) => setSize(e.target.value)}
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

              <Box width={'50%'} p={2}>
                <Select
                  variant="filled"
                  label={'Strike Price'}
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
                <Box p={2}>{'This contract can be minted'}</Box>
              ) : (
                <Box p={2}>
                  {`This market doesn't exist yet. Creating new markets from the UI is coming soon!`}
                </Box>
              )
            ) : null}

            <Box p={2}>
              {marketData ? (
                <Button
                  fullWidth
                  variant={'outlined'}
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
                <Button fullWidth variant={'outlined'} color="primary" disabled>
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
