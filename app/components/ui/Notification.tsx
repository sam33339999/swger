"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faInfoCircle, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  message,
  duration = 3000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'info':
        return faInfoCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'error':
        return faTimesCircle;
      default:
        return faInfoCircle;
    }
  };
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90';
      case 'info':
        return 'bg-blue-500/90';
      case 'warning':
        return 'bg-amber-500/90';
      case 'error':
        return 'bg-red-500/90';
      default:
        return 'bg-blue-500/90';
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center p-3 rounded-md shadow-lg ${getBackgroundColor()} text-white max-w-md transition-all duration-300 ease-in-out`}>
      <FontAwesomeIcon icon={getIcon()} className="mr-2" />
      <span>{message}</span>
    </div>
  );
};

// 通知管理器
interface NotificationManagerProps {
  children: React.ReactNode;
}

export interface NotificationOptions {
  type?: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextValue {
  showNotification: (options: NotificationOptions) => void;
}

export const NotificationContext = React.createContext<NotificationContextValue>({
  showNotification: () => {},
});

export const NotificationProvider: React.FC<NotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<(NotificationOptions & { id: string })[]>([]);
  
  const showNotification = (options: NotificationOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { ...options, id }]);
  };
  
  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type || 'info'}
            message={notification.message}
            duration={notification.duration}
            onClose={() => handleClose(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// 自定義Hook
export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default Notification;
