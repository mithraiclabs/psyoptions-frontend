import { useContext } from 'react'
import { ExpirationDateContext } from '../context/ExpirationDateContext'

const useExpirationDate = () => useContext(ExpirationDateContext)

export default useExpirationDate
