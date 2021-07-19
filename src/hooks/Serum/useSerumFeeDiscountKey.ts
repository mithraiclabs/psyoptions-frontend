import { getFeeRates, getFeeTier } from '@mithraic-labs/serum'
import { PublicKey } from '@mithraic-labs/solana-web3.js'
import { useMemo } from 'react'
import { getHighestAccount } from '../../utils/token'
import useAssetList from '../useAssetList'
import useOwnedTokenAccounts from '../useOwnedTokenAccounts'

/**
 * Find the SRM Account with the highest balance to use for fees.
 *
 * @returns SRMFeePublicKey
 */
export const useSerumFeeDiscountKey = (): {
  feeRates: {
    maker: number
    taker: number
  }
  publicKey: PublicKey | null
} => {
  const { srmPublicKey } = useAssetList()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()

  return useMemo(() => {
    const srmAccounts = ownedTokenAccounts[srmPublicKey?.toString()] ?? []
    const highestSRMAccount = getHighestAccount(srmAccounts)
    const feeTier = getFeeTier(0, highestSRMAccount?.amount ?? 0)
    const feeRates = getFeeRates(feeTier)
    return {
      feeRates,
      publicKey: Object.keys(highestSRMAccount).length
        ? highestSRMAccount.pubKey
        : null,
    }
  }, [ownedTokenAccounts, srmPublicKey])
}
