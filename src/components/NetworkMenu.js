import React, { useState } from 'react'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Card from '@material-ui/core/Card'
import Popper from '@material-ui/core/Popper'
import MenuItem from '@material-ui/core/MenuItem'
import MenuList from '@material-ui/core/MenuList'

import useConnection from '../hooks/useConnection'
import theme from '../utils/theme'

const NetworkMenu = () => {
  const {
    networks,
    connection,
    endpoint,
    setEndpoint,
    setProgramId,
  } = useConnection()

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

  return (
    <Box style={{ position: 'relative' }} ml={2}>
      <Button
        color="primary"
        onClick={() => {
          setOpen(!open)
        }}
        variant="outlined"
      >
        {endpoint.name}
      </Button>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        style={{
          position: 'absolute',
          inset: 'initial',
          right: 0,
          marginTop: '16px',
          zIndex: 20,
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
              {networks.map((item) => (
                <MenuItem
                  onClick={(event) => {
                    setEndpoint(item)
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
