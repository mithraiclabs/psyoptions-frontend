import React from 'react'
import Brightness1 from '@material-ui/icons/Brightness1'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import styled from 'styled-components'

import useWallet from '../hooks/useWallet'
import theme from '../utils/theme'

const Btn = styled(Button)`
  border: 1px solid ${theme.palette?.primary?.main};
  padding: 4px 12px;
`

const WalletStatus = () => {
  const { pubKey, connect, connected } = useWallet()

  const pubKeyB58 = pubKey && pubKey.toBase58 && pubKey.toBase58().slice(0,5)

  const handleConnect = () => {
    if (!connected) {
      connect()
    }
  }

  return (
    <Btn color="primary" onClick={handleConnect}>
      <Box pr={2}>
        <Brightness1 style={{ fontSize: 12, color: connected ? theme.palette.success.main : theme.palette.disabled.main }} />
      </Box>
      {connected ? `Connected [${pubKeyB58}…]` : 'Connect Wallet'}
    </Btn>
  )
}

export default WalletStatus
