import React, { useState } from 'react'
import BN from 'bn.js'
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import CircularProgress from '@material-ui/core/CircularProgress'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import Link from '@material-ui/core/Link'

import theme from '../../utils/theme'
import Page from './Page'
import ConnectButton from '../ConnectButton'

import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts'
import useNotifications from '../../hooks/useNotifications'
import useWallet from '../../hooks/useWallet'
import useAssetList from '../../hooks/useAssetList'
import useConnection from '../../hooks/useConnection'
import useSendTransaction from '../../hooks/useSendTransaction'
import { buildAirdropTokensIx } from '../../utils/airdropInstructions'
import { createAssociatedTokenAccountInstruction } from '../../utils/instructions/token'

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
  const { pushErrorNotification } = useNotifications()
  const { balance: solBalance, connected, wallet, pubKey } = useWallet()
  const { connection } = useConnection()
  const { supportedAssets: assets } = useAssetList()
  const { sendTransaction } = useSendTransaction()
  const {
    ownedTokenAccounts: accounts,
    subscribeToTokenAccount,
    refreshTokenAccounts,
  } = useOwnedTokenAccounts()

  const [loadingBTC, setLoadingBTC] = useState(false)
  const [loadingPSY, setLoadingPSY] = useState(false)
  const [loadingUSDC, setLoadingUSDC] = useState(false)
  const [loadingSOL, setLoadingSOL] = useState(false)

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

  const handleClaimSOL = async () => {
    setLoadingSOL(true)
    await connection.requestAirdrop(pubKey, 10 * LAMPORTS_PER_SOL)
    setLoadingSOL(false)
  }

  const createAccountsAndAirdrop = async (
    asset,
    existingAccount,
    amount,
    message,
  ) => {
    try {
      let receivingAccountPublicKey = existingAccount?.pubKey
      const tx = new Transaction()
      const mintPublicKey = new PublicKey(asset.mintAddress)

      if (!existingAccount) {
        const [ix, associatedTokenPublicKey] =
          await createAssociatedTokenAccountInstruction({
            payer: pubKey,
            owner: pubKey,
            mintPublicKey,
          })
        tx.add(ix)
        receivingAccountPublicKey = associatedTokenPublicKey
        subscribeToTokenAccount(receivingAccountPublicKey)
      }

      const amountToDrop = new BN(amount).mul(
        new BN(10).pow(new BN(asset.decimals)),
      )

      const airdropIx = await buildAirdropTokensIx(
        amountToDrop,
        undefined, // admin key, not needed
        mintPublicKey,
        receivingAccountPublicKey,
        new PublicKey(asset.faucetAddress),
      )
      tx.add(airdropIx)

      await sendTransaction({
        transaction: tx,
        wallet,
        signers: [],
        connection,
        sendingMessage: `Processing: ${message}`,
        successMessage: `Confirmed: ${message}`,
      })
    } catch (err) {
      pushErrorNotification(err)
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
      100_000,
      'Claim 100,000 USDC',
    )
    setLoadingUSDC(false)
  }

  const handleClaimPSY = async () => {
    setLoadingPSY(true)
    await createAccountsAndAirdrop(PSY, psyAccount, 1000, 'Claim 1,000 PSY')
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
                  <Avatar src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png" />
                  <Box px={2}>
                    Devnet SOL
                    <br />
                    Balance: {(solBalance / LAMPORTS_PER_SOL).toFixed(2)}
                  </Box>
                </Box>
                {loadingSOL ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimSOL}
                  >
                    Claim 10 SOL
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
                    Claim 100,000 USDC
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
