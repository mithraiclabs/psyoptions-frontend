import { useContext } from 'react';
import { SupportedAssetContext } from '../context/SupportedAssetContext';

const useAssetList = () => {
  const supportedAssets = useContext(SupportedAssetContext);
  return supportedAssets;
}

export default useAssetList
