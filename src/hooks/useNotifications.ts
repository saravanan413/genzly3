
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToNotifications, 
  markNotificationAsSeen, 
  getUnreadNotificationsCount,
  Notification 
} from '../services/notifications';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(currentUser.uid, (newNotifications) => {
      setNotifications(newNotifications);
      
      // Calculate unread count
      const unseenCount = newNotifications.filter(n => !n.seen).length;
      setUnreadCount(unseenCount);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const markAsSeen = async (notificationId: string) => {
    try {
      await markNotificationAsSeen(notificationId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, seen: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return notification.text ? `commented: "${notification.text}"` : 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'message':
        return 'sent you a message';
      default:
        return notification.message;
    }
  };

  const getRelativeTime = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsSeen,
    getNotificationMessage,
    getRelativeTime
  };
};
