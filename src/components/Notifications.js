import React from 'react'

import Snackbar from '@material-ui/core/Snackbar'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'

import { Box } from '@material-ui/core'
import useNotifications from '../hooks/useNotifications'
import theme from '../utils/theme'

const SimpleSnackbar = ({
  message = '',
  link,
  severity = 'info',
  closeNotification,
}) => (
  <Snackbar
    open
    autoHideDuration={6000}
    onClose={(event, reason) => {
      if (reason === 'clickaway') {
        return
      }
      closeNotification() // eslint-disable-line
    }}
    style={{
      position: 'relative',
      margin: '10px',
      transform: 'none',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    }}
  >
    <Box
      px={2}
      py={1}
      width="100%"
      alignItems="center"
      borderRadius={3}
      display="flex"
      justifyContent="space-between"
      color={theme.palette.primary.light}
      style={{
        background: theme.gradients[severity],
      }}
    >
      <Box maxWidth="90%">
        <Box
          fontSize="small"
          textOverflow="ellipsis"
          overflow="hidden"
          width="100%"
        >
          {message}
        </Box>
        {link && <Box fontSize="small">{link}</Box>}
      </Box>
      <Box>
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={closeNotification}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  </Snackbar>
)

const Notifications = () => {
  const { notifications, closeNotification } = useNotifications()

  return (
    <Box
      position="fixed"
      bottom="0"
      right="0"
      // dialog has a zIndex of 1300, this must be higher
      zIndex="1500"
      p="6px"
      width={['100%', '370px']}
    >
      {notifications.map((data, i) => (
        <SimpleSnackbar
          key={i}
          index={i}
          closeNotification={() => closeNotification(i)}
          {...data}
        />
      ))}
    </Box>
  )
}

export default Notifications
