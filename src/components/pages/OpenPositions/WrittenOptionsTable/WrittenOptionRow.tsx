import React, { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import Box from '@material-ui/core/Box'
import { withStyles, useTheme } from '@material-ui/core/styles'

import BN from 'bn.js'
import { OptionType, TokenAccount } from '../../../../types'
import { formatExpirationTimestamp } from '../../../../utils/format'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { useCloseWrittenOptionPostExpiration } from '../../../../hooks/useCloseWrittenOptionPostExpiration'
import { useClosePosition } from '../../../../hooks/useClosePosition'
import useOwnedTokenAccounts from '../../../../hooks/useOwnedTokenAccounts'
import useConnection from '../../../../hooks/useConnection'
import { useExchangeWriterTokenForQuote } from '../../../../hooks/useExchangeWriterTokenForQuote'
import useNotifications from '../../../../hooks/useNotifications'
import useAssetList from '../../../../hooks/useAssetList'
import TxButton from '../../../TxButton'

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip)

type WrittenOptionRowProps = {
  expired: boolean
  marketKey: string
  writerTokenAccounts: TokenAccount[]
  heldContracts: TokenAccount[]
}

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = React.memo(
  ({
    expired,
    marketKey,
    writerTokenAccounts,
    heldContracts,
  }: WrittenOptionRowProps) => {
    const theme = useTheme()
    const [closeOneLoading, setCloseOneLoading] = useState(false)
    const [closeAllLoading, setCloseAllLoading] = useState(false)
    const [claimQuoteLoading, setClaimQuoteLoading] = useState(false)
    const { supportedAssets } = useAssetList()
    const { pushNotification } = useNotifications()
    const { connection } = useConnection()
    const { ownedTokenAccounts } = useOwnedTokenAccounts()
    const { markets } = useOptionsMarkets()
    const [quotePoolNotEmpty, setQuoteAssetPoolNotEmpty] = useState(false)
    const market = markets[marketKey]
    // TODO handle multiple wallets for the same Writer Token
    const initialWriterTokenAccount = writerTokenAccounts[0]
    const ownedUAssetKey = ownedTokenAccounts[market.uAssetMint]?.[0]?.pubKey
    const ownedQAssetKey = ownedTokenAccounts[market.qAssetMint]?.[0]?.pubKey
    const ownedOptionTokenAccounts =
      ownedTokenAccounts[market.optionMintKey.toString()]
    const { closeOptionPostExpiration } = useCloseWrittenOptionPostExpiration(
      market,
      ownedUAssetKey,
      initialWriterTokenAccount.pubKey,
    )
    const { exchangeWriterTokenForQuote } = useExchangeWriterTokenForQuote(
      market,
      initialWriterTokenAccount.pubKey,
      ownedQAssetKey,
    )
    const holdsContracts = !!heldContracts.length
    // TODO handle multiple wallets for same Option Token
    const initialOptionTokenAccount = heldContracts[0]
    const { closePosition } = useClosePosition(
      market,
      // initialOptionTokenAccount can be undefined if there are no held contracts
      initialOptionTokenAccount?.pubKey,
      ownedUAssetKey,
      initialWriterTokenAccount.pubKey,
    )

    const handleCloseOne = async () => {
      setCloseOneLoading(true)
      await closePosition()
      setCloseOneLoading(false)
    }

    const handleCloseAll = async (numContracts) => {
      setCloseAllLoading(true)
      await closePosition(numContracts)
      setCloseAllLoading(false)
    }

    const handleCloseOnePostExpiration = async () => {
      setCloseOneLoading(true)
      await closeOptionPostExpiration(initialWriterTokenAccount.amount)
      setCloseOneLoading(false)
    }

    const handleClaimQuote = async () => {
      setClaimQuoteLoading(true)
      await exchangeWriterTokenForQuote()
      setClaimQuoteLoading(false)
    }

    let optionType: OptionType
    if (market?.uAssetSymbol) {
      optionType = market?.uAssetSymbol?.match(/^USD/)
        ? OptionType.PUT
        : OptionType.CALL
    }

    const strike =
      optionType === OptionType.PUT
        ? market?.amountPerContract &&
          market.amountPerContract
            .dividedBy(market?.quoteAmountPerContract)
            .toString()
        : market?.strike.toString(10)

    const uAssetSymbol =
      optionType === OptionType.CALL
        ? market?.uAssetSymbol
        : market?.qAssetSymbol

    const uAssetImage = supportedAssets.find(
      (asset) =>
        asset?.tokenSymbol ===
        (optionType === OptionType.PUT
          ? market?.qAssetSymbol
          : market?.uAssetSymbol),
    )?.icon

    const lockedAmount =
      initialWriterTokenAccount.amount * parseInt(market.size, 10)
    const lockedAmountDisplay = `${lockedAmount}`.match(/\./g)
      ? `≈${lockedAmount.toFixed(2)}`
      : lockedAmount

    useEffect(() => {
      ;(async () => {
        try {
          const quoteToken = new Token(
            connection,
            new PublicKey(market.qAssetMint),
            TOKEN_PROGRAM_ID,
            null,
          )
          const quoteAssetPoolAccount = await quoteToken.getAccountInfo(
            market.quoteAssetPoolKey,
          )
          if (!(quoteAssetPoolAccount.amount as BN).isZero()) {
            setQuoteAssetPoolNotEmpty(true)
          }
        } catch (err) {
          pushNotification({
            severity: 'error',
            message: `${err}`,
          })
        }
      })()
    }, [
      connection,
      market.qAssetMint,
      market.quoteAssetPoolKey,
      pushNotification,
    ])

    const canClose = (ownedOptionTokenAccounts?.[0]?.amount || 0) > 0

    let ActionFragment = null
    if (expired) {
      ActionFragment = (
        <Box>
          <StyledTooltip
            title={
              <Box
                p={1}
              >{`The written option has expired, closing will return the locked underlying asset`}</Box>
            }
          >
            <Box
              display="flex"
              flexDirection={['column', 'column', 'row']}
              flexWrap="wrap"
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              <Box p={1}>
                <TxButton
                  color="primary"
                  variant="outlined"
                  onClick={handleCloseOnePostExpiration}
                  loading={closeOneLoading}
                >
                  {closeOneLoading ? 'Closing' : 'Close'}
                </TxButton>
              </Box>
            </Box>
          </StyledTooltip>
        </Box>
      )
    } else {
      ActionFragment = (
        <Box>
          {holdsContracts && (
            <StyledTooltip
              title={
                <Box
                  p={1}
                >{`Unlock the underlying asset used to write the contract by burning the option and writer tokens`}</Box>
              }
            >
              <Box
                display="flex"
                flexDirection={['column', 'column', 'row']}
                flexWrap="wrap"
                alignItems="flex-start"
                justifyContent="flex-start"
              >
                <Box p={1}>
                  <TxButton
                    color="primary"
                    variant="outlined"
                    onClick={handleCloseOne}
                    disabled={!canClose}
                    loading={closeOneLoading}
                  >
                    {closeOneLoading ? 'Closing One' : 'Close one'}
                  </TxButton>
                </Box>
                <Box p={1}>
                  <TxButton
                    color="primary"
                    variant="outlined"
                    onClick={() => {
                      handleCloseAll(
                        Math.min(
                          ownedOptionTokenAccounts?.[0]?.amount,
                          initialWriterTokenAccount.amount,
                        ),
                      )
                    }}
                    disabled={!canClose}
                    loading={closeAllLoading}
                  >
                    {closeAllLoading ? 'Closing All' : 'Close All'}
                  </TxButton>
                </Box>
              </Box>
            </StyledTooltip>
          )}
          {quotePoolNotEmpty && (
            <StyledTooltip
              title={
                <Box p={1}>
                  Some option contracts have been exercised. Burn the writer
                  token to claim the quote asset and forfeit the locked
                  underlying asset
                </Box>
              }
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                p={1}
              >
                <TxButton
                  color="primary"
                  variant="outlined"
                  onClick={handleClaimQuote}
                  style={{ marginLeft: holdsContracts ? 8 : 0 }}
                  loading={claimQuoteLoading}
                >
                  {claimQuoteLoading ? 'Claiming Quote' : 'Claim Quote'}
                </TxButton>
              </Box>
            </StyledTooltip>
          )}
        </Box>
      )
    }

    return (
      <Box
        key={marketKey}
        display="flex"
        flexDirection="row"
        alignItems="center"
        p={1}
      >
        <Box
          p={1}
          pl={2}
          width="12%"
          display="flex"
          flexDirection="row"
          alignItems="center"
        >
          <Avatar style={{ width: 24, height: 24 }} src={uAssetImage}>
            {uAssetSymbol.slice(0, 1)}
          </Avatar>
          <Box pl={1}>{uAssetSymbol}</Box>
        </Box>
        <Box p={1} width="8%">
          {optionType}
        </Box>
        <Box p={1} width="10%">
          {strike}
        </Box>
        <Box p={1} width="10%">
          {lockedAmountDisplay} {market.uAssetSymbol}
        </Box>
        <Box p={1} width="10%">
          {optionType === 'call'
            ? market.amountPerContract.toString()
            : market.quoteAmountPerContract.toString()}
        </Box>
        <Box p={1} width="10%">
          {initialWriterTokenAccount.amount}
        </Box>
        <Box p={1} width="10%">
          {ownedOptionTokenAccounts?.[0]?.amount}
        </Box>
        <Box p={1} width="15%">
          {expired ? (
            <Box color={theme.palette.error.main}>Expired</Box>
          ) : (
            formatExpirationTimestamp(market.expiration)
          )}
        </Box>
        <Box width="15%">{ActionFragment}</Box>
      </Box>
    )
  },
)
