import React from 'react'

import Snackbar from '@material-ui/core/Snackbar'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'

import useNotifications from '../hooks/useNotifications'
import { Box } from '@material-ui/core'
import theme from '../utils/theme'

const SimpleSnackbar = ({
  message = '',
  severity = 'info',
  closeNotification,
}) => (
  <Snackbar
    open
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
      width={'100%'}
      alignItems={'center'}
      borderRadius={3}
      display={'flex'}
      justifyContent={'space-between'}
      color={theme.palette[severity].contrastText}
      style={{
        background: theme.gradients[severity],
      }}
    >
      <Box fontSize="small">{message}</Box>
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
      zIndex="10"
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