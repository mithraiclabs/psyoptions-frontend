import React, { useState, useCallback, useMemo, createContext } from 'react'
import TransactionError from '../utils/transactionErrors/TransactionError'
import { NotificationSeverity } from '../types'

const NotificationsContext = createContext(undefined)

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

  /**
   * Special case for error notifications. We check if the error is a TransactionError
   * so we can decode error given the InstructionError. If it's not a TransactionError
   * then we just push the error's message as usual.
   */
  const pushErrorNotification = useCallback((error: Error) => {
    let content
    // Log the error for dev debugging purposes
    console.error(error)
    if (error instanceof TransactionError) {
      console.log('*** caught TransactionError', error)
      // TODO use programId to determine which program errored
      // TODO if known program map the error code to the error enum
      content = {
        severity: NotificationSeverity.ERROR,
        message: `${error}`,
      }
    } else {
      content = {
        severity: NotificationSeverity.ERROR,
        message: `${error}`,
      }
    }
    setNotifications((_notifications) => [content, ..._notifications])
  }, [])

  const closeNotification = useCallback((index) => {
    setNotifications((_notifications) =>
      _notifications.filter((_, i) => i !== index),
    )
  }, [])

  const value = useMemo(
    () => ({
      closeNotification,
      pushErrorNotification,
      pushNotification,
      notifications,
    }),
    [pushErrorNotification, pushNotification, closeNotification, notifications],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export { NotificationsContext, NotificationsProvider }
