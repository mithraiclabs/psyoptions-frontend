import React, { useState, useCallback, useMemo, createContext } from 'react'
import Snackbar from '@material-ui/core/Snackbar'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'

const SimpleSnackbar = ({ content = 'huehue', closeNotification }) => (
  <Snackbar
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
    open
    message={content}
    action={
      <>
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={closeNotification}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </>
    }
  />
)

const NotificationsContext = createContext()

const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  // useCallback() and useMemo() to prevent whole page re-renders
  const pushNotification = useCallback(
    (content) =>
      setNotifications((notifications) => [content, ...notifications]),
    []
  )

  const closeNotification = () => {
    const next = notifications.slice()
    next.pop()
    setNotifications(next)
  }

  const value = useMemo(() => ({ pushNotification }), [pushNotification])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {/* using i not an anti-pattern here since the data structure is literally a stack and so the unique id is equal to an array index */}
      {notifications.map((content, i) => (
        <SimpleSnackbar
          key={i}
          content={content}
          closeNotification={closeNotification}
        />
      ))}
    </NotificationsContext.Provider>
  )
}

export { NotificationsContext, NotificationsProvider }
