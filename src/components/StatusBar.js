import React, { useState } from 'react'
import Box from '@material-ui/core/Box'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import Hidden from '@material-ui/core/Hidden'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/icons/Menu'
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer'

import WalletStatus from './WalletStatus'
import NetworkMenu from './NetworkMenu'

import theme from '../utils/theme'

const NavOptions = () => {
  const history = useHistory()

  return (
    <>
      <Box mx={2}>
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
      <Box mx={2}>
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
      <Box mx={2}>
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
      <Box mx={2}>
        <Button href="#" onClick={() => {}} style={{ minWidth: 0 }}>
          Docs
        </Button>
      </Box>
    </>
  )
}

const StatusBar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <Hidden mdUp>
        <SwipeableDrawer
          anchor={'left'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => setDrawerOpen(true)}
        >
          <Box pt={6}>
            <NavOptions />
          </Box>
        </SwipeableDrawer>
      </Hidden>
      <Box
        px={3}
        py={1}
        display="flex"
        justifyContent="space-between"
        flexDirection="row"
        style={{
          background: theme.gradients?.warningSecondary,
        }}
      >
        <Box display="flex">
          <Hidden smDown>
            <NavOptions />
          </Hidden>
          <Hidden mdUp>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              style={{ padding: '4px 8px' }}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu />
            </IconButton>
          </Hidden>
        </Box>
        <Box display="flex">
          <WalletStatus />
          <NetworkMenu />
        </Box>
      </Box>
    </>
  )
}

export default StatusBar
