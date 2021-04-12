/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react'
import Chip from '@material-ui/core/Chip'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import PropTypes from 'prop-types'
import { PublicKey } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Box } from '@material-ui/core'
import { formatExpirationTimestamp } from '../../../../utils/format'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { useCloseWrittenOptionPostExpiration } from '../../../../hooks/useCloseWrittenOptionPostExpiration'
import { useClosePosition } from '../../../../hooks/useClosePosition'
import useOwnedTokenAccounts from '../../../../hooks/useOwnedTokenAccounts'
import useConnection from '../../../../hooks/useConnection'
import { useExchangeWriterTokenForQuote } from '../../../../hooks/useExchangeWriterTokenForQuote'

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = ({
  expired,
  marketKey,
  writerTokenAccounts,
  heldContracts,
}) => {
  const { connection } = useConnection()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()
  const { markets } = useOptionsMarkets()
  const [quotePoolNotEmpty, setQuoteAssetPoolNotEmpty] = useState(false)
  const market = markets[marketKey]
  // TODO handle multiple wallets for the same Writer Token
  const initialWriterTokenAccount = writerTokenAccounts[0]
  const ownedUAssetKey = ownedTokenAccounts[market.uAssetMint]?.[0]?.pubKey
  const ownedQAssetKey = ownedTokenAccounts[market.qAssetMint]?.[0]?.pubKey
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

  useEffect(() => {
    ;(async () => {
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
    })()
  }, [connection, market.qAssetMint, market.quoteAssetPoolKey])

  let ActionFragment = null
  if (expired) {
    ActionFragment = (
      <Chip
        clickable
        size="small"
        label="Close"
        color="primary"
        variant="outlined"
        onClick={closeOptionPostExpiration}
      />
    )
  } else {
    ActionFragment = (
      <Box display="flex" flexDirection="row" justifyContent="flex-end">
        {holdsContracts && (
          <Chip
            clickable
            size="small"
            label="Close Position"
            color="primary"
            variant="outlined"
            onClick={closePosition}
          />
        )}
        {quotePoolNotEmpty && (
          <Chip
            clickable
            size="small"
            label="Claim Quote"
            color="primary"
            variant="outlined"
            onClick={exchangeWriterTokenForQuote}
            style={holdsContracts && { marginLeft: 8 }}
          />
        )}
      </Box>
    )
  }

  return (
    <TableRow key={marketKey}>
      <TableCell width="20%">{`${market.uAssetSymbol}${market.qAssetSymbol}`}</TableCell>
      <TableCell width="15%">{market.strikePrice}</TableCell>
      <TableCell width="15%">
        {market.size} {market.uAssetSymbol}
      </TableCell>
      <TableCell width="15%">{-initialWriterTokenAccount.amount}</TableCell>
      <TableCell width="20%">
        {formatExpirationTimestamp(market.expiration)}
      </TableCell>
      <TableCell align="right" width="15%">
        {ActionFragment}
      </TableCell>
    </TableRow>
  )
}

const TokenAccounts = PropTypes.arrayOf(
  PropTypes.shape({
    // really instance of PublicKey, but instanceOf is throwing
    // Invalid prop `optionsWritten[0].contractTokenAcctAddress` of type `PublicKey`
    // supplied to `WrittenOptionRow`, expected instance of `PublicKey`
    amount: PropTypes.number.isRequired,
    mint: PropTypes.object.isRequired,
    pubKey: PropTypes.string.isRequired,
  }).isRequired,
).isRequired

WrittenOptionRow.propTypes = {
  expired: PropTypes.bool.isRequired,
  marketKey: PropTypes.string.isRequired,
  writerTokenAccounts: TokenAccounts,
  heldContracts: TokenAccounts,
}
