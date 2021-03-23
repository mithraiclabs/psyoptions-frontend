import React, { useState, useCallback, useMemo, createContext } from 'react'

const NotificationsContext = createContext()

const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    // Examples of possible severity states:
    // {
    //   severity: 'success',
    //   message: 'Success',
    // },
    // {
    //   severity: 'info',
    //   message: 'Info',
    // },
    // {
    //   severity: 'error',
    //   message: 'Error',
    // },
    // {
    //   severity: 'warning',
    //   message: 'Warning',
    // },
  ])

  // useCallback() and useMemo() to prevent whole page re-renders
  const pushNotification = useCallback(
    (content) =>
      setNotifications((_notifications) => [content, ..._notifications]),
    [],
  )

  const closeNotification = useCallback((index) => {
    setNotifications((_notifications) =>
      _notifications.filter((_, i) => i !== index),
    )
  }, [])

  const value = useMemo(
    () => ({ closeNotification, pushNotification, notifications }),
    [pushNotification, closeNotification, notifications],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export { NotificationsContext, NotificationsProvider }
