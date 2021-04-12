import React from 'react'
import Brightness1 from '@material-ui/icons/Brightness1'
import Box from '@material-ui/core/Box'

import useWallet from '../hooks/useWallet'
import theme from '../utils/theme'

import ConnectButton from './ConnectButton'

const WalletStatus = () => {
  const { pubKey, connected } = useWallet()
  const pubKeyB58 = pubKey && pubKey.toBase58 && pubKey.toBase58().slice(0, 5)

  return (
    <ConnectButton>
      <Box pr={2}>
        <Brightness1
          style={{
            fontSize: 12,
            color: connected
              ? theme.palette.success.main
              : theme.palette.disabled.main,
          }}
        />
      </Box>
      {connected ? `Connected ${pubKeyB58}...` : 'Connect Wallet'}
    </ConnectButton>
  )
}

export default WalletStatus
