/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react'
import Chip from '@material-ui/core/Chip'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import PropTypes from 'prop-types'
import { PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import Box from '@material-ui/core/Box'
import { formatExpirationTimestamp } from '../../../../utils/format'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { useCloseWrittenOptionPostExpiration } from '../../../../hooks/useCloseWrittenOptionPostExpiration'
import { useClosePosition } from '../../../../hooks/useClosePosition'
import useOwnedTokenAccounts from '../../../../hooks/useOwnedTokenAccounts'
import useConnection from '../../../../hooks/useConnection'
import { useExchangeWriterTokenForQuote } from '../../../../hooks/useExchangeWriterTokenForQuote'
import useNotifications from '../../../../hooks/useNotifications'

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = React.memo(
  ({ expired, marketKey, writerTokenAccounts, heldContracts }) => {
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
      ownedTokenAccounts[market.optionMintAddress]
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

    let ActionFragment = null
    if (expired) {
      ActionFragment = (
        <Box display="flex" flexDirection="row" justifyContent="flex-end">
          <Chip
            clickable
            size="small"
            label="Close"
            color="primary"
            variant="outlined"
            onClick={() => closeOptionPostExpiration()}
          />
          <Chip
            clickable
            size="small"
            label="Close All"
            color="primary"
            variant="outlined"
            onClick={() => {
              closeOptionPostExpiration(
                Math.min(
                  ownedOptionTokenAccounts?.[0]?.amount,
                  initialWriterTokenAccount.amount,
                ),
              )
            }}
          />
        </Box>
      )
    } else {
      ActionFragment = (
        <Box display="flex" flexDirection="row" justifyContent="flex-end">
          {holdsContracts && (
            <div>
              <Chip
                clickable
                size="small"
                label="Close Position"
                color="primary"
                variant="outlined"
                onClick={() => closePosition()}
              />
              <Chip
                clickable
                size="small"
                label="Close Available"
                color="primary"
                variant="outlined"
                onClick={() => {
                  closePosition(
                    Math.min(
                      ownedOptionTokenAccounts?.[0]?.amount,
                      initialWriterTokenAccount.amount,
                    ),
                  )
                }}
              />
            </div>
          )}
          {quotePoolNotEmpty && (
            <Chip
              clickable
              size="small"
              label="Claim Quote"
              color="primary"
              variant="outlined"
              onClick={exchangeWriterTokenForQuote}
              style={{ marginLeft: holdsContracts ? 8 : 0 }}
            />
          )}
        </Box>
      )
    }

    return (
      <TableRow hover key={marketKey}>
        <TableCell width="5%" />
        {/* <TableCell width="12%">Asset Pair</TableCell>
            <TableCell width="10%">Type</TableCell>
            <TableCell width="12%">Strike</TableCell>
            <TableCell width="12%">Locked Assets</TableCell>
            <TableCell width="5%">Contract Size</TableCell>
            <TableCell width="7%">Written</TableCell>
            <TableCell width="7%">Available</TableCell>
            <TableCell width="15%">Expiration</TableCell> */}
        <TableCell width="10%">{`${market.uAssetSymbol}-${market.qAssetSymbol}`}</TableCell>
        <TableCell width="9%">{optionType}</TableCell>
        <TableCell width="10%">{strike}</TableCell>
        <TableCell width="13%">
          {initialWriterTokenAccount.amount * market.size} {market.uAssetSymbol}
        </TableCell>
        <TableCell width="10%">
          {optionType === 'call'
            ? market.amountPerContract.toString()
            : market.quoteAmountPerContract.toString()}
        </TableCell>
        <TableCell width="7%">{initialWriterTokenAccount.amount}</TableCell>
        <TableCell width="8%">
          {ownedOptionTokenAccounts?.[0]?.amount}
        </TableCell>
        <TableCell width="16%">
          {formatExpirationTimestamp(market.expiration)}
        </TableCell>
        <TableCell align="right" width="15%">
          {ActionFragment}
        </TableCell>
      </TableRow>
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
