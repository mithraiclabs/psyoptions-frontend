/* eslint-disable react/forbid-prop-types */
import React from 'react'
import Chip from '@material-ui/core/Chip'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import PropTypes from 'prop-types'
import { formatExpirationTimestamp } from '../../../../utils/format'
import useOptionsMarkets from '../../../../hooks/useOptionsMarkets'
import { useCloseWrittenOptionPostExpiration } from '../../../../hooks/useCloseWrittenOptionPostExpiration'

/**
 * Row to display the wallet's minted options
 *
 * Only closes a single expired option at a time right now.
 */
export const WrittenOptionRow = ({ expired, marketKey, optionsWritten }) => {
  const { markets } = useOptionsMarkets()
  const market = markets[marketKey]
  const nextWrittenOption = optionsWritten[0]
  const onCloseWrittenOption = useCloseWrittenOptionPostExpiration(
    market.optionMintAddress,
    market.optionMarketDataAddress,
    nextWrittenOption.underlyingAssetAcctAddress,
    nextWrittenOption.quoteAssetAcctAddress,
    nextWrittenOption.contractTokenAcctAddress,
    market.writerRegistryAddress
  )

  return (
    <TableRow key={marketKey}>
      <TableCell width="20%">{`${market.uAssetSymbol}${market.qAssetSymbol}`}</TableCell>
      <TableCell width="15%">{market.strikePrice}</TableCell>
      <TableCell width="15%">
        {market.size} {market.uAssetSymbol}
      </TableCell>
      <TableCell width="15%">{-optionsWritten.length}</TableCell>
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
            onClick={onCloseWrittenOption}
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
  optionsWritten: PropTypes.arrayOf(
    PropTypes.shape({
      // really instance of PublicKey, but instanceOf is throwing
      // Invalid prop `optionsWritten[0].contractTokenAcctAddress` of type `PublicKey`
      // supplied to `WrittenOptionRow`, expected instance of `PublicKey`
      contractTokenAcctAddress: PropTypes.object.isRequired,
      quoteAssetAcctAddress: PropTypes.object.isRequired,
      underlyingAssetAcctAddress: PropTypes.object.isRequired,
    }).isRequired,
  ).isRequired,
}
