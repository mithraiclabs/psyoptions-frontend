import React from 'react'
import Box from '@material-ui/core/Box'
import Link from '@material-ui/core/Link'

import WalletStatus from './WalletStatus'

const StatusBar = () => {
  return (
    <Box px={3} py={2} justifyContent="space-between" flexDirection="row">
      <Box>
        <Link>Buy/Sell</Link>
        <Link>Open Positions</Link>
        <Link>Portfolio</Link>
        <Link>Docs</Link>
      </Box>
      <Box>
        <WalletStatus />
      </Box>
    </Box>
  )
}

export default StatusBar
