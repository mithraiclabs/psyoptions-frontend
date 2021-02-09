import React from 'react'
import Box from '@material-ui/core/Box'

import WalletStatus from './WalletStatus'

const StatusBar = () => {
  return (
    <Box px={3} py={2} align="center">
      <WalletStatus />
    </Box>
  )
}

export default StatusBar
