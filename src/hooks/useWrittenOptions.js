import { useMemo } from 'react'
import useOptionsMarkets from './useOptionsMarkets'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'

/**
 * Loop over all markets and their Option Writer Registries (not ideal)
 * to find Option Writers that match accounts in the current wallet
 *
 * @example // structure
 * {
 *  1617235200-SRM-USDC-10-10: [
 *    {
 *      contractTokenAcctAddress: PublicKey
 *      quoteAssetAcctAddress: PublicKey
 *      underlyingAssetAcctAddress: PublicKey
 *    }
 *  ]
 * }
 */
export const useWrittenOptions = () => {
  const { markets } = useOptionsMarkets()
  const ownedTokenAccounts = useOwnedTokenAccounts()

  return useMemo(
    () =>
      Object.keys(markets).reduce((acc, marketKey) => {
        const market = markets[marketKey]
        const underlyingAssetTokenAccounts =
          ownedTokenAccounts[market.uAssetMint]
        const writerAccounts = market.optionWriterRegistry?.reduce(
          (accountsWhereWalletIsWriter, optionWriter) => {
            // For close, the wallet must own the Underlying asset accout in order to get it sent
            if (
              underlyingAssetTokenAccounts?.find(
                (account) =>
                  account.pubKey ===
                  optionWriter.underlyingAssetAcctAddress.toString(),
              )
            ) {
              // Wallet owns the underlying asset account for this writer in the registry
              accountsWhereWalletIsWriter.push(optionWriter)
            }
            return accountsWhereWalletIsWriter
          },
          [],
        )

        if (writerAccounts?.length) {
          acc[marketKey] = writerAccounts
        }
        return acc
      }, {}),
    [markets, ownedTokenAccounts],
  )
}
