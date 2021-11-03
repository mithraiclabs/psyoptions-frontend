import React, { useState, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import Avatar from '@material-ui/core/Avatar';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useConnectedWallet } from "@saberhq/use-solana";
import useAssetList from '../../hooks/useAssetList';
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts';
import { getHighestAccount, WRAPPED_SOL_ADDRESS } from '../../utils/token';
import useWalletInfo from '../../hooks/useWalletInfo';

const Balances: React.FC = () => {
  const wallet = useConnectedWallet();
  const { balance } = useWalletInfo();
  const { uAsset, qAsset, assetListLoading } = useAssetList();
  const { ownedTokenAccounts, loadingOwnedTokenAccounts } =
    useOwnedTokenAccounts();
  const [qAssetBalance, setQAssetBalance] = useState(0);
  const [uAssetBalance, setUAssetBalance] = useState(0);

  useEffect(() => {
    const uAssetAccounts = ownedTokenAccounts[uAsset?.mintAddress ?? ''] || [];
    const qAssetAccounts = ownedTokenAccounts[qAsset?.mintAddress ?? ''] || [];
    const qAssetHighestAccount = getHighestAccount(qAssetAccounts);
    const newQAssetBalance = qAssetHighestAccount ? qAssetHighestAccount.amount / 10 ** (qAsset?.decimals ?? 0) : 0;
    setQAssetBalance(newQAssetBalance);

    const uAssetHighestAccount = getHighestAccount(uAssetAccounts);
    let newUAssetBalance = uAssetHighestAccount ? uAssetHighestAccount.amount / 10 ** (uAsset?.decimals ?? 0) : 0;
    if (uAsset?.mintAddress === WRAPPED_SOL_ADDRESS) {
      // if asset is wrapped Sol, use balance of wallet account
      newUAssetBalance = balance ? (balance / LAMPORTS_PER_SOL) : null;
    }
    setUAssetBalance(newUAssetBalance);

  }, [ownedTokenAccounts, qAsset, uAsset, balance]);

  if (!loadingOwnedTokenAccounts && !assetListLoading && wallet?.connected) {
    return (
      <Box
        display="flex"
        flexDirection={['row', 'row', 'column']}
        alignItems="flex-start"
        fontSize={'14px'}
        px={[1, 1, 0]}
      >
        <Box px={[1, 1, 0]}>Wallet Balances:</Box>
        <Box display="flex" px={[1, 1, 0]} pt={[0, 0, 1]}>
          <Box display="flex" flexDirection={'row'} alignItems="center" mr={1}>
            <Avatar
              style={{ width: '20px', height: '20px', marginRight: '6px' }}
              src={uAsset?.icon}
            />{' '}
            {uAssetBalance.toFixed(2)} {uAsset?.tokenSymbol}
          </Box>
          <Box display="flex" flexDirection={'row'} alignItems="center" mx={1}>
            <Avatar
              style={{ width: '20px', height: '20px', marginRight: '6px' }}
              src={qAsset?.icon}
            />{' '}
            {qAssetBalance.toFixed(2)} {qAsset?.tokenSymbol}
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
};

export default Balances;
