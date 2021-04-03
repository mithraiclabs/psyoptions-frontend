import { useContext } from 'react'
import { AssetListContext } from '../context/AssetListContext'

const useAssetList = (): AssetListContext => useContext(AssetListContext)

export default useAssetList
