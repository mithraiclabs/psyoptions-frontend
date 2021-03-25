/* eslint-disable react/forbid-prop-types */
import React from 'react'
import Chip from '@material-ui/core/Chip'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import PropTypes from 'prop-types'
import { PublicKey } from '@solana/web3.js';
import { formatExpirationTimestamp } from '../../../../utils/format'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { useCloseWrittenOptionPostExpiration } from '../../../../hooks/useCloseWrittenOptionPostExpiration'
import useOwnedTokenAccounts from '../../../../hooks/useOwnedTokenAccounts';

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = ({ expired, marketKey, writerTokenAccounts }) => {
  const { ownedTokenAccounts } = useOwnedTokenAccounts()
  const { markets } = useOptionsMarkets()
  const market = markets[marketKey]
  // TODO handle multiple wallets for the same Writer Token
  const initialWriterTokenAccount = writerTokenAccounts[0]
  const ownedUAssetAddress =
    ownedTokenAccounts[market.uAssetMint][0]?.pubKey
  const { closeOptionPostExpiration } = useCloseWrittenOptionPostExpiration(
    market,
    new PublicKey(ownedUAssetAddress),
    new PublicKey(initialWriterTokenAccount.pubKey)
  )

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
      {expired ? (
        <TableCell align="right" width="15%">
          <Chip
            clickable
            size="small"
            label="Close"
            color="primary"
            variant="outlined"
            onClick={closeOptionPostExpiration}
          />
        </TableCell>
      ) : (
        <TableCell align="right" width="15%" />
      )}
    </TableRow>
  )
}

WrittenOptionRow.propTypes = {
  expired: PropTypes.bool.isRequired,
  marketKey: PropTypes.string.isRequired,
  writerTokenAccounts: PropTypes.arrayOf(
    PropTypes.shape({
      // really instance of PublicKey, but instanceOf is throwing
      // Invalid prop `optionsWritten[0].contractTokenAcctAddress` of type `PublicKey`
      // supplied to `WrittenOptionRow`, expected instance of `PublicKey`
      amount: PropTypes.number.isRequired,
      mint: PropTypes.object.isRequired,
      pubKey: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
}
