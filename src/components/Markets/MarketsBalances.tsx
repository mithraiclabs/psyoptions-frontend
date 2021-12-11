import React, { useState, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import Avatar from '@material-ui/core/Avatar';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useConnectedWallet } from '@saberhq/use-solana';
import { useRecoilValue } from 'recoil';
import BN from 'bn.js';
import useAssetList from '../../hooks/useAssetList';
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts';
import { getHighestAccount, WRAPPED_SOL_ADDRESS } from '../../utils/token';
import useWalletInfo from '../../hooks/useWalletInfo';
import { quoteMint, underlyingMint } from '../../recoil';
import { useTokenByMint } from '../../hooks/useNetworkTokens';
import { useNormalizeAmountOfMintBN } from '../../hooks/useNormalizeAmountOfMintBN';

const Balances: React.FC = () => {
  const _underlyingMint = useRecoilValue(underlyingMint);
  const _quoteMint = useRecoilValue(quoteMint);
  const wallet = useConnectedWallet();
  const { balance } = useWalletInfo();
  const { assetListLoading } = useAssetList();
  const { ownedTokenAccounts, loadingOwnedTokenAccounts } =
    useOwnedTokenAccounts();
  const underlyingAsset = useTokenByMint(_underlyingMint?.toString() ?? '');
  const underlyingAssetSymbol =
    underlyingAsset?.symbol ?? _underlyingMint?.toString() ?? '';
  const normalizeUnderlyingBN = useNormalizeAmountOfMintBN(_underlyingMint);
  const normalizeQuoteBN = useNormalizeAmountOfMintBN(_quoteMint);
  const quoteAsset = useTokenByMint(_quoteMint?.toString() ?? '');
  const quoteAssetSymbol = quoteAsset?.symbol ?? _quoteMint?.toString() ?? '';
  const [qAssetBalance, setQAssetBalance] = useState(0);
  const [uAssetBalance, setUAssetBalance] = useState(0);

  useEffect(() => {
    const uAssetAccounts =
      ownedTokenAccounts[_underlyingMint?.toString() ?? ''] || [];
    const qAssetAccounts =
      ownedTokenAccounts[_quoteMint?.toString() ?? ''] || [];
    const qAssetHighestAccount = getHighestAccount(qAssetAccounts);
    const newQAssetBalance = normalizeQuoteBN(
      new BN(qAssetHighestAccount?.amount ?? 0),
    );
    setQAssetBalance(newQAssetBalance.toNumber());

    const uAssetHighestAccount = getHighestAccount(uAssetAccounts);
    let newUAssetBalance = normalizeUnderlyingBN(
      new BN(uAssetHighestAccount?.amount ?? 0),
    ).toNumber();
    if (_underlyingMint?.toString() === WRAPPED_SOL_ADDRESS) {
      // if asset is wrapped Sol, use balance of wallet account
      newUAssetBalance = balance ? balance / LAMPORTS_PER_SOL : 0;
    }
    setUAssetBalance(newUAssetBalance);
  }, [
    ownedTokenAccounts,
    balance,
    _underlyingMint,
    _quoteMint,
    normalizeQuoteBN,
    normalizeUnderlyingBN,
  ]);

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
              src={underlyingAsset?.logoURI}
            />{' '}
            {uAssetBalance.toFixed(2)} {underlyingAssetSymbol}
          </Box>
          <Box display="flex" flexDirection={'row'} alignItems="center" mx={1}>
            <Avatar
              style={{ width: '20px', height: '20px', marginRight: '6px' }}
              src={quoteAsset?.logoURI}
            />{' '}
            {qAssetBalance.toFixed(2)} {quoteAssetSymbol}
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
};

export default Balances;
