import React from 'react'
import RadioButtonUnchecked from '@material-ui/icons/RadioButtonUnchecked'
import RadioButtonChecked from '@material-ui/icons/RadioButtonChecked'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import styled from 'styled-components'

import useWallet from '../hooks/useWallet'
import theme from '../utils/theme'

const Btn = styled(Button)`
  border: 2px solid ${theme.palette?.primary?.main};
`

const WalletStatus = () => {
  const { wallet, connect, connected, loading } = useWallet()

  const handleConnect = () => {
    if (!connected) {
      connect()
    }
  }

  return (
    <Box px={3} py={2}>
      <Btn color="primary" onClick={handleConnect}>
        <Box pr={1}>
          {connected ? (
            <RadioButtonChecked style={{ fontSize: 18 }} />
          ) : (
            <RadioButtonUnchecked style={{ fontSize: 18 }} />
          )}
        </Box>
        {connected ? 'Connected' : 'Connect Wallet'}
      </Btn>
    </Box>
  )
}

export default WalletStatus
