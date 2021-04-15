import { useContext } from 'react'
import {
  OwnedTokenAccountsContext,
  OwnedTokenAccountsContextT,
} from '../context/OwnedTokenAccounts'

const useOwnedTokenAccounts = (): OwnedTokenAccountsContextT =>
  useContext(OwnedTokenAccountsContext)

export default useOwnedTokenAccounts
