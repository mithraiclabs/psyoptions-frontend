import { useEffect, useState } from 'react'
import { utils } from '@mithraic-labs/options-js-bindings'
import useOptionsMarkets from './useOptionsMarkets'
import useOwnedTokenAccounts from './useOwnedTokenAccounts'
import useConnection from './useConnection';

/**
 * Loop over all markets and their Option Writer Registries (not ideal)
 * to find Option Writers that match accounts in the current wallet.
 * 
 * Note we're not using this in a context high in the tree since it's expensive.
 * We should avoid calling this whenever possible.
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
  const { connection } = useConnection()
  const { markets } = useOptionsMarkets()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()
  const [writtenOptions, setWrittenOptions] = useState({});

  useEffect(() => {
    (async () => {
      // fetch option writer registries and find Option Writers that match addresses 
      // owned by the connected wallet
      const _writtenOptions = {};
      await Promise.all(Object.keys(markets).map(async marketKey => {
        const market = markets[marketKey]
        const underlyingAssetTokenAccounts =
          ownedTokenAccounts[market.uAssetMint]
        // fetch option registry by market
        const { writerRegistryAddress } = markets[marketKey]
        const { registry, registryLength } = await utils.getOptionWriterRegistry(connection, writerRegistryAddress)

        // loop over registry length to find written options.
        // Note: used a for loop instead of reduce because the registry directly
        // from on chain will always be max length. It will just consist of 
        // "Option Writers" that have PublicKeys that are all 0
        const writerAccounts = [];
        for (let i = 0; i < registryLength; i += 1) {
          const optionWriter = registry[i]
          if (
            underlyingAssetTokenAccounts?.find(
              (account) =>
                account.pubKey ===
                optionWriter.underlyingAssetAcctAddress.toString(),
            )
          ) {
            // Wallet owns the underlying asset account for this writer in the registry
            writerAccounts.push(optionWriter)
          }
        }
        if (writerAccounts.length) {
          _writtenOptions[marketKey] = writerAccounts
        }
      }))

      setWrittenOptions(_writtenOptions)
    })()
  }, [connection, markets, ownedTokenAccounts])

  return writtenOptions
}
