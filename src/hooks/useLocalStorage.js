import { createLocalStorageStateHook } from 'use-local-storage-state'

export const useOwnedTokenAccountsLocalStorage = createLocalStorageStateHook(
  'ownedTokenAccounts',
  {}
)
