import { useContext } from 'react'
import { AssetListContext } from '../context/AssetListContext'

const useAssetList = () => useContext(AssetListContext)

export default useAssetList
