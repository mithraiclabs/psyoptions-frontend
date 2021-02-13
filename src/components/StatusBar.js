import React from 'react'
import Box from '@material-ui/core/Box'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'

import WalletStatus from './WalletStatus'
import NetworkMenu from './NetworkMenu'

import theme from '../utils/theme'

const StatusBar = () => {
  const history = useHistory()

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
          <Button
            href="/mint"
            onClick={(e) => {
              e.preventDefault()
              history.push('/mint')
            }}
          >
            Mint Options
          </Button>
        </Box>
        <Box mx={1}>
          <Button
            href="/open-positions"
            onClick={(e) => {
              e.preventDefault()
              history.push('/open-positions')
            }}
          >
            Open Positions
          </Button>
        </Box>
        <Box mx={1}>
          <Button
            href="/history"
            onClick={(e) => {
              e.preventDefault()
              history.push('/history')
            }}
          >
            History
          </Button>
        </Box>
        <Box mx={1}>
          <Button href="#" onClick={() => {}}>
            Docs
          </Button>
        </Box>
      </Box>
      <Box display="flex">
        <WalletStatus />
        <NetworkMenu />
      </Box>
    </Box>
  )
}

export default StatusBar
