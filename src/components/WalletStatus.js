import React, { useState } from 'react'
import Brightness1 from '@material-ui/icons/Brightness1'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'

import useWallet from '../hooks/useWallet'
import theme from '../utils/theme'

import WalletSelect from './WalletSelect'

const WalletStatus = () => {
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const { pubKey, connect, connected } = useWallet()

  const pubKeyB58 = pubKey && pubKey.toBase58 && pubKey.toBase58().slice(0, 5)

  const handleConnect = async (adapter) => {
    await connect(adapter)
    console.log('closing select')
    setIsSelectOpen(false)
  }

  return (
    <>
      <WalletSelect
        open={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        handleConnect={handleConnect}
        connected={connected}
      />
      <Button
        color="primary"
        onClick={() => setIsSelectOpen(true)}
        variant="outlined"
        style={{ whiteSpace: 'nowrap' }}
      >
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
      </Button>
    </>
  )
}

export default WalletStatus
