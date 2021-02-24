import { useContext } from 'react'
import { NotificationsContext } from '../context/NotificationsContext'

const useNotifications = () => {
  const { closeNotification, notifications, pushNotification } = useContext(
    NotificationsContext
  )

  return {
    closeNotification,
    notifications,
    pushNotification,
  }
}

export default useNotifications
