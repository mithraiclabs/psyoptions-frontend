import { useContext } from 'react'
import { OwnedTokenAccountsContext } from '../context/OwnedTokenAccounts'
import { TokenAccount } from '../types'

type OwnedTokenAccountsContext = {
  loadingOwnedTokenAccounts: boolean
  ownedTokenAccounts: Record<string, TokenAccount[]>
  refreshTokenAccounts: () => void
}
const useOwnedTokenAccounts = (): OwnedTokenAccountsContext =>
  useContext(OwnedTokenAccountsContext) as OwnedTokenAccountsContext

export default useOwnedTokenAccounts
