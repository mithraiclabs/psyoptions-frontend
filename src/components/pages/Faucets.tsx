import React, { useState } from 'react'
import BN from 'bn.js'
import { PublicKey, Transaction } from '@solana/web3.js'
import CircularProgress from '@material-ui/core/CircularProgress'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'

import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../hooks/useNotifications'
import useWallet from '../../hooks/useWallet'
import useAssetList from '../../hooks/useAssetList'

import theme from '../../utils/theme'
import Page from './Page'
import ConnectButton from '../ConnectButton'

import { buildAirdropTokensIx } from '../../utils/airdropInstructions'
import { initializeTokenAccountTx } from '../../utils/token'
import useConnection from '../../hooks/useConnection'

const darkBorder = `1px solid ${(theme.palette.background as any).main}`

const { DEVNET_FAUCET_USDC, DEVNET_FAUCET_BTC, DEVNET_FAUCET_PSY } = process.env

const getHighestAccount = (accounts) => {
  if (accounts.length === 0) return undefined
  if (accounts.length === 1) return accounts[0]
  return accounts.sort((a, b) => b.amount - a.amount)[0]
}

const LoadingAirdrop = () => (
  <Box width="160px" textAlign="center" padding="6px">
    <CircularProgress size={32} />
  </Box>
)

const Faucets = () => {
  const { pushNotification } = useNotifications()
  const { connected, wallet, pubKey } = useWallet()
  const { connection } = useConnection()
  const { supportedAssets: assets } = useAssetList()
  const { ownedTokenAccounts: accounts } = useOwnedTokenAccounts()

  const [loadingBTC, setLoadingBTC] = useState(false)
  const [loadingPSY, setLoadingPSY] = useState(false)
  const [loadingUSDC, setLoadingUSDC] = useState(false)

  const BTC = {
    ...(assets.find((a) => a.tokenSymbol === 'BTC') || {}),
    faucetAddress: DEVNET_FAUCET_BTC,
  }
  const PSY = {
    ...(assets.find((a) => a.tokenSymbol === 'PSY') || {}),
    faucetAddress: DEVNET_FAUCET_PSY,
  }
  const USDC = {
    ...(assets.find((a) => a.tokenSymbol === 'USDC') || {}),
    faucetAddress: DEVNET_FAUCET_USDC,
  }
  const btcAccount = getHighestAccount(accounts[BTC?.mintAddress] || [])
  const psyAccount = getHighestAccount(accounts[PSY?.mintAddress] || [])
  const usdcAccount = getHighestAccount(accounts[USDC?.mintAddress] || [])

  const btcBalance = btcAccount ? btcAccount.amount * 10 ** -BTC.decimals : 0
  const psyBalance = psyAccount ? psyAccount.amount * 10 ** -PSY.decimals : 0
  const usdcBalance = usdcAccount
    ? usdcAccount.amount * 10 ** -USDC.decimals
    : 0

  const createAccountsAndAirdrop = async (
    asset,
    existingAccount,
    amount,
    message,
  ) => {
    try {
      let receivingAccount = existingAccount
      const txes = []
      const mintPublicKey = new PublicKey(asset.mintAddress)

      const recentBlockhash = (await connection.getRecentBlockhash('max'))
        .blockhash

      if (!existingAccount) {
        // TODO - this isn't working, error is "cannot read property toString of undefined"
        console.log({
          connection,
          payer: { publicKey: pubKey },
          mintPublicKey,
          owner: pubKey,
        })
        // Create account transaction
        const { transaction, newTokenAccount } = await initializeTokenAccountTx(
          {
            connection,
            payer: { publicKey: pubKey },
            mintPublicKey,
            owner: pubKey,
          } as any,
        )
        transaction.recentBlockhash = recentBlockhash
        transaction.feePayer = pubKey
        receivingAccount = newTokenAccount
        txes.push(transaction)
      }

      const amountToDrop = new BN(amount).mul(
        new BN(10).pow(new BN(asset.decimals)),
      )

      const airdropTx = new Transaction()
      const ix = await buildAirdropTokensIx(
        amountToDrop,
        undefined, // admin key
        mintPublicKey, // asset mint public key
        receivingAccount.pubKey, // destination public key
        new PublicKey(asset.faucetAddress), // Faucet public key
      )
      airdropTx.add(ix)
      airdropTx.feePayer = pubKey
      airdropTx.recentBlockhash = recentBlockhash
      txes.push(airdropTx)

      await wallet.signAllTransactions(txes)

      pushNotification({
        severity: 'info',
        message: `Processing: ${message}`,
      })

      txes.forEach(async (tx) => {
        const txid = await connection.sendRawTransaction(tx.serialize())
        await connection.confirmTransaction(txid)
      })

      pushNotification({
        severity: 'success',
        message: `Confirmed: ${message}`,
      })
    } catch (err) {
      console.error(err)
      pushNotification({
        severity: 'error',
        message: `${err}`,
      })
    }
  }

  const handleClaimBTC = async () => {
    setLoadingBTC(true)
    await createAccountsAndAirdrop(BTC, btcAccount, 10, 'Claim 10 BTC')
    setLoadingBTC(false)
  }

  const handleClaimUSDC = async () => {
    setLoadingUSDC(true)
    await createAccountsAndAirdrop(
      USDC,
      usdcAccount,
      10000,
      'Claim 10,000 USDC',
    )
    setLoadingUSDC(false)
  }

  const handleClaimPSY = async () => {
    setLoadingPSY(true)
    await createAccountsAndAirdrop(BTC, btcAccount, 1000, 'Claim 1,000 PSY')
    setLoadingPSY(false)
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
            minHeight: '360px',
          }}
        >
          <Box p={2} textAlign="center" padding="6px">
            <h2 style={{ margin: '10px 0 0' }}>Devnet Faucets</h2>
          </Box>
          <Box p={2}>
            Claim Devnet SPL tokens here. These faucets airdrop Devnet SPLs for
            testing only, they are not real and have no value.
          </Box>
          {connected ? (
            <>
              <Box
                p={2}
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                style={{ borderTop: darkBorder }}
              >
                <Box flexDirection="row" display="flex" alignItems="center">
                  <Avatar src={USDC?.icon} />
                  <Box px={2}>
                    Devnet USDC
                    <br />
                    Balance: {usdcBalance.toFixed(2)}
                  </Box>
                </Box>
                {loadingUSDC ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimUSDC}
                  >
                    Claim 10,000 USDC
                  </Button>
                )}
              </Box>
              <Box
                p={2}
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                style={{ borderTop: darkBorder }}
              >
                <Box flexDirection="row" display="flex" alignItems="center">
                  <Avatar src={BTC?.icon} />
                  <Box px={2}>
                    Devnet BTC
                    <br />
                    Balance: {btcBalance.toFixed(2)}
                  </Box>
                </Box>
                {loadingBTC ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimBTC}
                  >
                    Claim 10 BTC
                  </Button>
                )}
              </Box>
              <Box
                p={2}
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                style={{ borderTop: darkBorder }}
              >
                <Box flexDirection="row" display="flex" alignItems="center">
                  <Avatar src={PSY?.icon} />
                  <Box px={2}>
                    Devnet PSY
                    <br />
                    Balance: {psyBalance.toFixed(2)}
                  </Box>
                </Box>
                {loadingPSY ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimPSY}
                  >
                    Claim 1,000 PSY
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <Box
              p="80px"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <ConnectButton>Connect Wallet</ConnectButton>
            </Box>
          )}
        </Paper>
      </Box>
    </Page>
  )
}

export default Faucets
