"use client";

import { useNotificationContext } from '../context/NotificationContext';
import NotificationPopup from './shared/NotificationPopup';

const NotificationManager = () => {
  const { currentNotification, hideNotification } = useNotificationContext();

  return (
    <NotificationPopup
      notification={currentNotification}
      onClose={hideNotification}
    />
  );
};

export default NotificationManager;
