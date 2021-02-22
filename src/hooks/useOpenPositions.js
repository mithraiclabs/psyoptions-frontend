import { useContext } from 'react'
import { OpenPositionsContext } from '../context/OpenPositionsContext'

const useOpenPositions = () => useContext(OpenPositionsContext)

export default useOpenPositions
