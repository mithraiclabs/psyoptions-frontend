import React, { useState } from 'react'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Card from '@material-ui/core/Card'
import Popper from '@material-ui/core/Popper'
import MenuItem from '@material-ui/core/MenuItem'
import MenuList from '@material-ui/core/MenuList'

import useConnection from '../hooks/useConnection'
import useAssetList from '../hooks/useAssetList'
import useOptionsChain from '../hooks/useOptionsChain'
import useOptionsMarkets from '../hooks/useOptionsMarkets'
import useSerum from '../hooks/useSerum'
import theme from '../utils/theme'

const NetworkMenu = () => {
  const { networks, endpoint, setEndpoint } = useConnection()
  const {
    setUAsset,
    setQAsset,
    setSupportedAssets,
    assetListLoading,
  } = useAssetList()
  const { setChain } = useOptionsChain()
  const { setMarkets, marketsLoading } = useOptionsMarkets()
  const { setSerumMarkets } = useSerum()

  const [open, setOpen] = useState(false)
  const anchorRef = React.useRef(null)

  const handleListKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      setOpen(false)
    }
  }

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return
    }

    setOpen(false)
  }

  // Do not allow switching network while still loading on-chain data
  const loading = marketsLoading || assetListLoading

  const handleSelectNetwork = (ep) => {
    if (loading) return
    setEndpoint(ep)
    // Reset assets, markets, and chain when changing endpoint
    // This allows us to refresh everything when changing the endpoint
    setSupportedAssets([])
    setUAsset({})
    setQAsset({})
    // TODO setChain is not defined here
    setChain([])
    setMarkets({})
    setSerumMarkets({})
  }

  return (
    <Box style={{ position: 'relative' }} ml={2}>
      <Button
        color="primary"
        onClick={() => {
          if (open === false && !loading) {
            setOpen(true)
          } else {
            setOpen(false)
          }
        }}
        variant="outlined"
        innerRef={anchorRef}
        disabled={loading}
      >
        {endpoint.name}
      </Button>
      <Popper
        anchorEl={anchorRef.current}
        open={open}
        role={undefined}
        transition
        disablePortal
        placement="bottom-end"
        style={{
          position: 'absolute',
          inset: 'initial',
          right: 0,
          left: 'auto',
          marginTop: '16px',
          zIndex: 20,
          width: 'fit-content',
        }}
      >
        <Card
          style={{
            background: theme.palette?.background?.light,
          }}
          elevation={12}
        >
          <ClickAwayListener onClickAway={handleClose}>
            <MenuList
              autoFocusItem={open}
              id="menu-list-grow"
              onKeyDown={handleListKeyDown}
            >
              {networks
                .filter((n) => n.programId !== undefined)
                .map((item) => (
                  <MenuItem
                    onClick={(event) => {
                      handleSelectNetwork(item)
                      handleClose(event)
                    }}
                    key={item.url}
                  >
                    <Box>
                      <Box>{item.name}</Box>
                      <Box fontSize={10}>{item.url}</Box>
                    </Box>
                  </MenuItem>
                ))}
            </MenuList>
          </ClickAwayListener>
        </Card>
      </Popper>
    </Box>
  )
}

export default NetworkMenu
