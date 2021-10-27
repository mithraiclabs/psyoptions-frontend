import React, { useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Avatar from '@material-ui/core/Avatar';
import { useTheme } from '@material-ui/core/styles';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useConnectedWallet } from "@saberhq/use-solana";
import useAssetList from '../hooks/useAssetList';
import useOwnedTokenAccounts from '../hooks/useOwnedTokenAccounts';
import { WRAPPED_SOL_ADDRESS, getHighestAccount } from '../utils/token';
import useWalletInfo from '../hooks/useWalletInfo';
import { Balance, TokenAccount } from '@/types';
import { Token } from '@mithraic-labs/market-meta/dist/types';


type SupportedAssetAccounts = {
  asset: Token;
  accounts: TokenAccount[];
}

const SupportedAssetBalances: React.FC = () => {
  const theme = useTheme();
  const wallet = useConnectedWallet();
  const { balance } = useWalletInfo();
  const [balances, setBalances] = useState([] as Balance[]);
  const { supportedAssets, assetListLoading } = useAssetList();
  const { ownedTokenAccounts, loadingOwnedTokenAccounts } =
    useOwnedTokenAccounts();

  useEffect(() => {
    const supportedAssetAccounts: SupportedAssetAccounts[] = supportedAssets.map((asset) => {
      return {
        asset,
        accounts: ownedTokenAccounts[asset?.mintAddress] || [],
      };
    });
  
    const newBalances: Balance[] = supportedAssetAccounts.map(({ asset, accounts }) => {
      const highestAccount = getHighestAccount(accounts);
      let assetBalance: number = highestAccount ?
        highestAccount.amount / 10 ** asset?.decimals : 0;
      if (asset?.mintAddress === WRAPPED_SOL_ADDRESS) {
        // if asset is wrapped Sol, use balance of wallet account
        assetBalance = balance ? balance / LAMPORTS_PER_SOL : 0;
      }
      return {
        asset,
        assetBalance,
      };
    });
    setBalances(newBalances);
  }, [supportedAssets, ownedTokenAccounts, balance]);


  if (loadingOwnedTokenAccounts || assetListLoading || !wallet?.connected) {
    return null;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      fontSize={'14px'}
      px={2}
      pt={2}
      pb={1}
      bgcolor={theme.palette.background.medium}
    >
      <Box
        px={[1, 1, 0]}
        pb={1}
        style={{ fontWeight: 700, fontSize: '16px' }}
      >
        Wallet Balances
      </Box>
      <Box
        display="flex"
        px={[1, 1, 0]}
        flexWrap="wrap"
        flexDirection={['column', 'row']}
      >
        {balances.map(({ asset, assetBalance }) => (
          <Box
            display="flex"
            flexDirection={'row'}
            alignItems="center"
            mr={2}
            pb={1}
            key={asset?.tokenSymbol}
          >
            <Avatar
              style={{ width: '24px', height: '24px', marginRight: '8px' }}
              src={asset?.icon}
            />{' '}
            {assetBalance.toFixed(2)} {asset?.tokenSymbol}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SupportedAssetBalances;
