import { useContext } from 'react'
import { OwnedTokenAccountsContext } from '../context/OwnedTokenAccounts'

const useOwnedTokens = () => useContext(OwnedTokenAccountsContext)

export default useOwnedTokens
