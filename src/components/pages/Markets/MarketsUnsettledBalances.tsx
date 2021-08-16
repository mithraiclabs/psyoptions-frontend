import React from 'react'
import Box from '@material-ui/core/Box'
import Link from '@material-ui/core/Link'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import BN from 'bn.js'

import useWallet from '../../../hooks/useWallet'
import useAssetList from '../../../hooks/useAssetList'
import useOwnedTokenAccounts from '../../../hooks/useOwnedTokenAccounts'
import { useSerumOpenOrders } from '../../../context/SerumOpenOrdersContext'

import { WRAPPED_SOL_ADDRESS, getHighestAccount } from '../../../utils/token'

const BN_ZERO = new BN(0)

const MarketsUnsettledBalances: React.FC = () => {
  const { balance, connected } = useWallet()
  const { uAsset, qAsset, assetListLoading } = useAssetList()
  const { ownedTokenAccounts, loadingOwnedTokenAccounts } =
    useOwnedTokenAccounts()
  const uAssetAccounts = ownedTokenAccounts[uAsset?.mintAddress] || []
  const qAssetAccounts = ownedTokenAccounts[qAsset?.mintAddress] || []
  const [serumOpenOrders, setSerumOpenOrders] = useSerumOpenOrders()

  // const qAssetBalance =
  //   (getHighestAccount(qAssetAccounts)?.amount || 0) / 10 ** qAsset?.decimals
  // let uAssetBalance =
  //   (getHighestAccount(uAssetAccounts)?.amount || 0) / 10 ** uAsset?.decimals
  // if (uAsset?.mintAddress === WRAPPED_SOL_ADDRESS) {
  //   // if asset is wrapped Sol, use balance of wallet account
  //   uAssetBalance = balance / LAMPORTS_PER_SOL
  // }
  const unsettledOrdersSet = new Set()
  Object.values(serumOpenOrders).forEach(serumMarket => {
    const baseFree = serumMarket.orders?.[0]?.baseTokenFree ?? BN_ZERO
    const quoteFree = serumMarket.orders?.[0]?.quoteTokenFree ?? BN_ZERO
    
    if (
      baseFree.toNumber() <= 0 &&
      quoteFree.toNumber() <= 0
    ) {
      unsettledOrdersSet.add(false)
    }

    unsettledOrdersSet.add(true)
  })

  if (!connected || !unsettledOrdersSet.has(true)) {
    return null
  }


  // update logic to be connected && hasUnsettledFunds
  // if (!loadingOwnedTokenAccounts && !assetListLoading && connected) {
    return (
      <Box
        display="flex"
        flexDirection={['row', 'row', 'column']}
        alignItems="flex-start"
        fontSize={'14px'}
        px={[1, 1, 0]}
      >
        <Box px={[1, 1, 0]}>Unsettled Balances:</Box>
        <Box display="flex" px={[1, 1, 0]} pt={[0, 0, 1]}>
          <Box display="flex" flexDirection={'row'} alignItems="center" mr={1}>
            <span>You have&nbsp;</span>
            <Link 
              href='#unsettled-balances-table'
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>unsettled balances</span>
              <KeyboardArrowDown 
                viewBox="0 0 24 24" 
                style={{ width: '20px', height: '20px' }}
              />
            </Link>
          </Box>
        </Box>
      </Box>
    )
  // }

  // return null
}

export default MarketsUnsettledBalances