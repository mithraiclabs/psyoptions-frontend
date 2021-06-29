/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import Box from '@material-ui/core/Box'
import { withStyles, useTheme } from '@material-ui/core/styles'
import PropTypes from 'prop-types'

import { formatExpirationTimestamp } from '../../../../utils/format'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { useCloseWrittenOptionPostExpiration } from '../../../../hooks/useCloseWrittenOptionPostExpiration'
import { useClosePosition } from '../../../../hooks/useClosePosition'
import useOwnedTokenAccounts from '../../../../hooks/useOwnedTokenAccounts'
import useConnection from '../../../../hooks/useConnection'
import { useExchangeWriterTokenForQuote } from '../../../../hooks/useExchangeWriterTokenForQuote'
import useNotifications from '../../../../hooks/useNotifications'
import useAssetList from '../../../../hooks/useAssetList'

const StyledTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.lighter,
    maxWidth: 370,
    fontSize: '14px',
    lineHeight: '18px',
  },
}))(Tooltip)

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = React.memo(
  ({ expired, marketKey, writerTokenAccounts, heldContracts }) => {
    const theme = useTheme()
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

    let optionType = ''
    if (market?.uAssetSymbol) {
      optionType = market?.uAssetSymbol?.match(/^USD/) ? 'put' : 'call'
    }

    const strike =
      optionType === 'put'
        ? market?.amountPerContract &&
          market.amountPerContract
            .dividedBy(market?.quoteAmountPerContract)
            .toString()
        : market?.strikePrice

    const uAssetSymbol =
      optionType === 'call' ? market?.uAssetSymbol : market?.qAssetSymbol

    const uAssetImage = supportedAssets.find(
      (asset) =>
        asset?.tokenSymbol ===
        (optionType === 'put' ? market?.qAssetSymbol : market?.uAssetSymbol),
    )?.icon

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
          if (!quoteAssetPoolAccount.amount.isZero()) {
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
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => closeOptionPostExpiration(1)}
                >
                  Close One
                </Button>
              </Box>
              <Box p={1}>
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => {
                    closeOptionPostExpiration(initialWriterTokenAccount.amount)
                  }}
                >
                  Close All
                </Button>
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
                  <Button
                    color="primary"
                    variant="outlined"
                    minWidth="100px"
                    flexShrink={0}
                    onClick={closePosition}
                    disabled={!canClose}
                  >
                    Close One
                  </Button>
                </Box>
                <Box p={1}>
                  <Button
                    color="primary"
                    variant="outlined"
                    minWidth="100px"
                    flexShrink={0}
                    onClick={() => {
                      closePosition(
                        Math.min(
                          ownedOptionTokenAccounts?.[0]?.amount,
                          initialWriterTokenAccount.amount,
                        ),
                      )
                    }}
                    disabled={!canClose}
                  >
                    Close All
                  </Button>
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
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={exchangeWriterTokenForQuote}
                  style={{ marginLeft: holdsContracts ? 8 : 0 }}
                >
                  Claim Quote
                </Button>
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
          {initialWriterTokenAccount.amount * market.size} {market.uAssetSymbol}
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
        <Box align="right" width="15%">
          {ActionFragment}
        </Box>
      </Box>
    )
  },
)

const TokenAccounts = PropTypes.arrayOf(
  PropTypes.shape({
    // really instance of PublicKey, but instanceOf is throwing
    // Invalid prop `optionsWritten[0].contractTokenAcctAddress` of type `PublicKey`
    // supplied to `WrittenOptionRow`, expected instance of `PublicKey`
    amount: PropTypes.number.isRequired,
    mint: PropTypes.object.isRequired,
    pubKey: PropTypes.object.isRequired,
  }).isRequired,
).isRequired

WrittenOptionRow.propTypes = {
  expired: PropTypes.bool.isRequired,
  marketKey: PropTypes.string.isRequired,
  writerTokenAccounts: TokenAccounts,
  heldContracts: TokenAccounts,
}
