import React from 'react'
import Box from '@material-ui/core/Box'
import Avatar from '@material-ui/core/Avatar'
import { LAMPORTS_PER_SOL } from '@mithraic-labs/solana-web3.js'

import useWallet from '../../../hooks/useWallet'
import useAssetList from '../../../hooks/useAssetList'
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts'

import { WRAPPED_SOL_ADDRESS, getHighestAccount } from '../../../utils/token'

const Balances: React.FC = () => {
  const { balance, connected } = useWallet()
  const { uAsset, qAsset, assetListLoading } = useAssetList()
  const { ownedTokenAccounts, loadingOwnedTokenAccounts } =
    useOwnedTokenAccounts()
  const uAssetAccounts = ownedTokenAccounts[uAsset?.mintAddress] || []
  const qAssetAccounts = ownedTokenAccounts[qAsset?.mintAddress] || []

  const qAssetBalance =
    (getHighestAccount(qAssetAccounts)?.amount || 0) / 10 ** qAsset?.decimals
  let uAssetBalance =
    (getHighestAccount(uAssetAccounts)?.amount || 0) / 10 ** uAsset?.decimals
  if (uAsset?.mintAddress === WRAPPED_SOL_ADDRESS) {
    // if asset is wrapped Sol, use balance of wallet account
    uAssetBalance = balance / LAMPORTS_PER_SOL
  }

  if (!loadingOwnedTokenAccounts && !assetListLoading && connected) {
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
    )
  }

  return null
}

export default Balances
