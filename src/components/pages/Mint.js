import React, { useEffect, useState } from 'react'
import moment from 'moment'
import Done from '@material-ui/icons/Done'
import { Box, Paper, Button, Chip } from '@material-ui/core'
import { PublicKey } from '@solana/web3.js'

import theme from '../../utils/theme'
import { initializeTokenAccountTx } from '../../utils/token'
import { truncatePublicKey } from '../../utils/format'

import useNotifications from '../../hooks/useNotifications'
import useWallet from '../../hooks/useWallet'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts'
import useConnection from '../../hooks/useConnection'

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
  const { pushNotification } = useNotifications()
  const { connection } = useConnection()
  const { connect, connected, wallet, pubKey, loading } = useWallet()
  const { getMarket, getStrikePrices, getSizes, mint } = useOptionsMarkets()
  const ownedTokenAccounts = useOwnedTokenAccounts()

  const dates = next3Months

  const [date, setDate] = useState(dates[0])
  const [uAsset, setUAsset] = useState()
  const [qAsset, setQAsset] = useState()
  const [size, setSize] = useState(100)
  const [price, setPrice] = useState('')
  const [uAssetAccount, setUAssetAccount] = useState('')
  const [qAssetAccount, setQAssetAccount] = useState('')
  const [mintedOptionAccount, setMintedOptionAccount] = useState('')

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

  const ownedUAssetAccounts =
    (uAsset && ownedTokenAccounts[uAsset.mintAddress]) || []
  const ownedQAssetAccounts =
    (qAsset && ownedTokenAccounts[qAsset.mintAddress]) || []
  const ownedMintedOptionAccounts =
    (marketData && ownedTokenAccounts[marketData.optionMintAddress]) || []

  // console.log('ownedQAssetAccounts', ownedQAssetAccounts)

  useEffect(() => {
    setUAssetAccount(ownedUAssetAccounts[0]?.pubKey || '')
  }, [ownedUAssetAccounts])

  useEffect(() => {
    setQAssetAccount(ownedQAssetAccounts[0]?.pubKey || '')
  }, [ownedQAssetAccounts])

  useEffect(() => {
    setMintedOptionAccount(ownedMintedOptionAccounts[0]?.pubKey || '')
  }, [ownedMintedOptionAccounts])

  const handleMint = async () => {
    if (uAssetAccount) {
      pushNotification({
        severity: 'error',
        message: `Error: You must have a ${marketData.uAssetSymbol} account in your wallet to mint this contract`,
      })
      return
    }

    if (uAssetAccount.value < marketData.size) {
      pushNotification({
        severity: 'error',
        message: `Error: Underlying Asset account must have at least ${marketData.size} ${marketData.uAssetSymbol} to mint this contract`,
      })
      return
    }

    try {
      let quoteAssetDestAccount = qAssetAccount || ownedQAssetAccounts[0]
      // If user has no quote asset account, we can create one because they don't need any quote asset to mint
      if (!quoteAssetDestAccount) {
        // TODO: this is not quite working once we get to the actaully mint function call
        // Maybe just require user to have both qAssetAccount and uAssetAccount before minting for MVP
        const [tx, newAccount] = await initializeTokenAccountTx({
          connection,
          payer: { publicKey: pubKey },
          mintPublicKey: new PublicKey(marketData.qAssetMint),
          newAccount,
        })
        const signed = await wallet.signTransaction(tx)
        const txid = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(txid, 1)
        quoteAssetDestAccount = newAccount.publicKey.toString()
        setQAssetAccount(quoteAssetDestAccount)

        // TODO: maybe we can send a name for this account to the wallet too, would be nice
        console.log('Added account: ', newAccount)
        pushNotification({
          severity: 'success',
          message: `Added new ${marketData.qAssetSymbol} account to wallet: ${quoteAssetDestAccount}.\n Do not remove this account from your wallet.`,
        })
      } else {
        console.log('Already have quote asset account')
      }

      // Fallback to first oowned minted option account
      let mintedOptionDestAccount =
        mintedOptionAccount || ownedMintedOptionAccounts[0]
      if (!mintedOptionDestAccount) {
        // Create token account for minted option if the user doesn't have one yet
        const [tx, newAccount] = await initializeTokenAccountTx({
          connection,
          payer: { publicKey: pubKey },
          mintPublicKey: new PublicKey(marketData.optionMintAddress),
          newAccount,
        })
        const signed = await wallet.signTransaction(tx)
        const txid = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(txid, 1)
        mintedOptionDestAccount = newAccount.publicKey.toString()
        setMintedOptionAccount(mintedOptionDestAccount)

        // TODO: maybe we can send a name for this account in the wallet too, would be nice

        console.log('Added account: ', newAccount)

        // How should we refer to this option account? For now I will put the key because it contains all the specific data, but we might want to just put the symbols of the two assets and drop the other stuff -- it will be visible on the open positions page anyway
        pushNotification({
          severity: 'success',
          message: `Added new ${marketData.key} covered call token account ${mintedOptionDestAccount} to wallet.`,
        })
      } else {
        console.log('Already have option account for this market')
      }

      console.log('Mint params: ', {
        uAssetAccount,
        quoteAssetDestAccount,
        mintedOptionDestAccount,
        marketData,
      })

      const txid = await mint({
        marketData,
        mintedOptionDestAccount,
        underlyingAssetSrcAccount: uAssetAccount,
        quoteAssetDestAccount,
      })

      pushNotification({
        severity: 'success',
        message: `Minted 1 new ${marketData.key} covered call token to address: ${mintedOptionDestAccount}.`,
      })

      console.log('Mint Successful')
    } catch (err) {
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
        height="100%"
        minHeight="620px"
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
              <h2 style={{ margin: '10px 0 0' }}>Mint Covered Call</h2>
            </Box>

            <Box p={2} borderBottom={darkBorder}>
              Expires On:
              <Box display="flex" flexWrap="wrap">
                {next3Months.map((moment) => {
                  const label = `${moment.format('ll')}, 00:00 UTC`
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
              <Box width={'50%'} p={2} borderRight={darkBorder}>
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
                    label={'Account'}
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

              <Box width={'50%'} p={2}>
                Quote Asset:
                <Box my={2}>
                  <SelectAsset
                    selectedAsset={qAsset}
                    onSelectAsset={(asset) => {
                      setQAsset(asset)
                      setPrice('')
                    }}
                  />
                </Box>
                {ownedQAssetAccounts.length > 1 ? (
                  <Select
                    variant="filled"
                    label={'Account'}
                    value={qAssetAccount}
                    onChange={(e) => setQAssetAccount(e.target.value)}
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
                ) : null}
              </Box>
            </Box>

            <Box display="flex" borderBottom={darkBorder}>
              <Box width={'50%'} p={2} borderRight={darkBorder}>
                <Select
                  variant="filled"
                  label={'Contract Size'}
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
