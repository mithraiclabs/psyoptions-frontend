import { useContext } from 'react';
import { WalletInfoContext } from '../context/WalletInfoContext';

const useWalletInfo = (): WalletInfoContext => useContext(WalletInfoContext);

export default useWalletInfo;