/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react'
import Box from '@material-ui/core/Box'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import Hidden from '@material-ui/core/Hidden'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/icons/Menu'
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer'
import NoSsr from '@material-ui/core/NoSsr'

import WalletStatus from './WalletStatus'
import NetworkMenu from './NetworkMenu'

import theme from '../utils/theme'
// @ts-ignore: asset import
import logo from '../../assets/psyoptions-logo-light.png'

import useConnection from '../hooks/useConnection'

const { INITIALIZE_PAGE_ENABLED } = process.env

const NavOptions = React.memo(() => {
  const history = useHistory()
  const { endpoint } = useConnection()

  return (
    <>
      <Box mx={2}>
        <Button
          href="/"
          onClick={(e) => {
            e.preventDefault()
            history.push('/')
          }}
          style={{ minWidth: 0, padding: 0 }}
        >
          <Box p={[1, 1, '2px']}>
            <img src={logo} width="32px" height="32px" alt="PsyOptions Logo" />
          </Box>
        </Button>
      </Box>
      <Box mx={2}>
        <Button
          href="/markets"
          onClick={(e) => {
            e.preventDefault()
            history.push('/markets')
          }}
        >
          Markets
        </Button>
      </Box>
      <Box mx={2}>
        <Button
          href="/simple/choose-asset"
          onClick={(e) => {
            e.preventDefault()
            history.push('/simple/choose-asset')
          }}
        >
          Beginner UI
        </Button>
      </Box>
      {INITIALIZE_PAGE_ENABLED && (
        <Box mx={2}>
          <Button
            href="/initialize-market"
            onClick={(e) => {
              e.preventDefault()
              history.push('/initialize-market')
            }}
          >
            Initialize
          </Button>
        </Box>
      )}
      <Box mx={2}>
        <Button
          href="/portfolio"
          onClick={(e) => {
            e.preventDefault()
            history.push('/portfolio')
          }}
        >
          Portfolio
        </Button>
      </Box>
      {endpoint?.name === 'Devnet' && (
        <Box mx={2}>
          <Button
            href="/faucets"
            onClick={(e) => {
              e.preventDefault()
              history.push('/faucets')
            }}
          >
            Faucets
          </Button>
        </Box>
      )}
      <Box mx={2}>
        <Button
          href="https://docs.psyoptions.io/"
          onClick={() => {}}
          style={{ minWidth: 0 }}
          target="_blank"
          rel="noopener"
        >
          Docs
        </Button>
      </Box>
    </>
  )
})

const StatusBar = ({ transparent }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <Hidden mdUp>
        <SwipeableDrawer
          anchor="left"
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
        px={[2, 2, 3]}
        py={1}
        display="flex"
        justifyContent="space-between"
        flexDirection="row"
        bgcolor={
          transparent ? 'transparent' : theme.gradients?.secondaryPrimary
        }
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
          <NoSsr>
            <NetworkMenu />
          </NoSsr>
        </Box>
      </Box>
    </>
  )
}

export default React.memo(StatusBar)
