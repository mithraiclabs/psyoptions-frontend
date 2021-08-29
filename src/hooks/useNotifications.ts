import { useContext } from 'react';
import { NotificationsContext } from '../context/NotificationsContext';

const useNotifications = () => {
  const {
    closeNotification,
    notifications,
    pushErrorNotification,
    pushNotification,
  } = useContext(NotificationsContext);

  return {
    closeNotification,
    notifications,
    pushErrorNotification,
    pushNotification,
  };
};

export default useNotifications;
