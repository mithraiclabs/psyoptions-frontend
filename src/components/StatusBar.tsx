import { useHistory } from 'react-router-dom';
import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/icons/Menu';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import NoSsr from '@material-ui/core/NoSsr';

import WalletStatus from './WalletStatus';
import NetworkMenu from './NetworkMenu';

import theme from '../utils/theme';

import useConnection from '../hooks/useConnection';
import { isTrue } from '../utils/general';

const { REACT_APP_INITIALIZE_PAGE_ENABLED } = process.env;

const NavOptions: React.VFC = () => {
  const history = useHistory();
  const { endpoint } = useConnection();

  return (
    <>
      <Box mx={2}>
        <Button
          onClick={(e) => {
            e.preventDefault();
            history.push('/');
          }}
          style={{ minWidth: 0, padding: 0 }}
        >
          <img src="images/psyoptions-logo-light.png" width="32" height="32" alt="PsyOptions Logo" />
        </Button>
      </Box>
      <Box mx={2}>
        <Button
          onClick={(e) => {
            e.preventDefault();
            history.push('/markets');
          }}
        >
          Markets
        </Button>
      </Box>
      <Box mx={2}>
        <Button
          onClick={(e) => {
            e.preventDefault();
            history.push('/simple/choose-asset');
          }}
        >
          Beginner UI
        </Button>
      </Box>
      {isTrue(REACT_APP_INITIALIZE_PAGE_ENABLED ?? false) && (
        <>
          <Box mx={2}>
            <Button
              onClick={(e) => {
                e.preventDefault();
                history.push('/initialize-market');
              }}
            >
              Initialize
            </Button>
          </Box>
          <Box mx={2}>
            <Button
              onClick={(e) => {
                e.preventDefault();
                history.push('/mint');
              }}
            >
              Mint
            </Button>
          </Box>
        </>
      )}
      <Box mx={2}>
        <Button
          onClick={(e) => {
            e.preventDefault();
            history.push('/portfolio');
          }}
        >
          Portfolio
        </Button>
      </Box>
      {endpoint?.name === 'Devnet' && (
        <Box mx={2}>
          <Button
            onClick={(e) => {
              e.preventDefault();
              history.push('/faucets');
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
  );
};

const StatusBar: React.VFC<{ transparent?: boolean }> = ({
  transparent = false,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        px={2}
        py={1}
        display="flex"
        justifyContent="space-between"
        flexDirection="row"
        style={{
          background: transparent
            ? 'transparent'
            : theme.gradients?.secondaryPrimary,
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
        <Box display="flex" style={{ alignItems: "center", zIndex: 99999 }}>
          <WalletStatus />
          <NoSsr>
            <NetworkMenu />
          </NoSsr>
        </Box>
      </Box>
    </>
  );
};

export default StatusBar;
