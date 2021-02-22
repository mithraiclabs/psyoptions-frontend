import { useContext } from 'react'
import { OwnedTokenAccountsContext } from '../context/OwnedTokenAccounts'

const useOwnedTokenAccounts = () => useContext(OwnedTokenAccountsContext) ?? {}

export default useOwnedTokenAccounts
