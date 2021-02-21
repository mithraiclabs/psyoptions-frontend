import { createLocalStorageStateHook } from 'use-local-storage-state'

export const useOptionsMarketsLocalStorage = createLocalStorageStateHook(
  'optionsMarkets',
  {}
)

export const useOwnedTokenAccountsLocalStorage = createLocalStorageStateHook(
  'ownedTokenAccounts',
  {}
)
