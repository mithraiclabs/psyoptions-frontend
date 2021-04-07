import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { getHighestAccount } from '../../utils/token'
import useAssetList from '../useAssetList'
import useOwnedTokenAccounts from '../useOwnedTokenAccounts'

/**
 * Find the SRM Account with the highest balance to use for fees.
 *
 * @returns SRMFeePublicKey
 */
export const useSerumFeeDiscountKey = (): PublicKey | null => {
  const { srmPublicKey } = useAssetList()
  const { ownedTokenAccounts } = useOwnedTokenAccounts()

  return useMemo(() => {
    if (!srmPublicKey) {
      return null
    }
    const srmAccounts = ownedTokenAccounts[srmPublicKey.toString()] ?? []
    const highestSRMAccount = getHighestAccount(srmAccounts)
    return highestSRMAccount ? new PublicKey(highestSRMAccount.pubKey) : null
  }, [ownedTokenAccounts, srmPublicKey])
}
