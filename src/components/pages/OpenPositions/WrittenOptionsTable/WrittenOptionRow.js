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
import { useClosePosition } from '../../../../hooks/useClosePosition'
import useOwnedTokenAccounts from '../../../../hooks/useOwnedTokenAccounts';

const ActionItem = ({expired, closeOptionPostExpiration, holdsContracts, closePosition}) => {
  if (expired) {
    return (
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
    )
  } if (holdsContracts) {
    return (
      <TableCell align="right" width="15%">
        <Chip
          clickable
          size="small"
          label="Close Position"
          color="primary"
          variant="outlined"
          onClick={closePosition}
        />
      </TableCell>
    )
  }
    return <TableCell align="right" width="15%" />
}
ActionItem.propTypes = {
  expired: PropTypes.bool.isRequired,
  closeOptionPostExpiration: PropTypes.func.isRequired,
  holdsContracts: PropTypes.bool,
  closePosition: PropTypes.func,
}

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = ({ expired, marketKey, writerTokenAccounts, heldContracts }) => {
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
  const holdsContracts = !!heldContracts.length;
  let _closePosition;
  if (holdsContracts) {
    // TODO handle multiple wallets for same Option Token
    const initialOptionTokenAccount = heldContracts[0];

    const { closePosition } = useClosePosition(
      market,
      new PublicKey(initialOptionTokenAccount.pubKey),
      new PublicKey(ownedUAssetAddress),
      new PublicKey(initialWriterTokenAccount.pubKey)
    )
    _closePosition = closePosition;
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
      <ActionItem 
        expired={expired}
        closeOptionPostExpiration={closeOptionPostExpiration}
        closePosition={_closePosition}
        holdsContracts={holdsContracts}
      />
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
).isRequired;

WrittenOptionRow.propTypes = {
  expired: PropTypes.bool.isRequired,
  marketKey: PropTypes.string.isRequired,
  writerTokenAccounts: TokenAccounts,
  heldContracts: TokenAccounts,
}
