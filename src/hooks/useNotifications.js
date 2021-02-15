import { NotificationsContext } from '../context/NotificationsContext'

const useNotifications = () => {
  const { pushNotification } = useContext(NotificationsContext)

  return {
    pushNotification,
  }
}

export default useNotifications
