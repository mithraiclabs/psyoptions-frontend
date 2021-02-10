import React from 'react'
import Box from '@material-ui/core/Box'
// import Link from '@material-ui/core/Link'
import Button from '@material-ui/core/Button'

import WalletStatus from './WalletStatus'

import theme from '../utils/theme'

const StatusBar = () => {
  return (
    <Box
      px={3}
      py={1}
      display="flex"
      justifyContent="space-between"
      flexDirection="row"
      style={{
        background: theme.gradients?.secondaryPrimary,
      }}
    >
      <Box display="flex">
        <Box mx={1}>
          <Button href="#" onClick={() => {}}>
            Buy/Sell
          </Button>
        </Box>
        <Box mx={1}>
          <Button href="#" onClick={() => {}}>
            Open Positions
          </Button>
        </Box>
        <Box mx={1}>
          <Button href="#" onClick={() => {}}>
            Portfolio
          </Button>
        </Box>
        <Box mx={1}>
          <Button href="#" onClick={() => {}}>
            Docs
          </Button>
        </Box>
      </Box>
      <Box>
        <WalletStatus />
      </Box>
    </Box>
  )
}

export default StatusBar
