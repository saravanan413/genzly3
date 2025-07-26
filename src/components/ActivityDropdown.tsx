
import React from 'react';
import { Heart, MessageCircle, UserPlus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { Badge } from './ui/badge';

const ActivityDropdown = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    markAsSeen, 
    getNotificationMessage, 
    getRelativeTime 
  } = useNotifications();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-red-500" size={16} />;
      case 'comment':
        return <MessageCircle className="text-blue-500" size={16} />;
      case 'follow':
        return <UserPlus className="text-green-500" size={16} />;
      default:
        return <User className="text-gray-400" size={16} />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as seen
    if (!notification.seen) {
      await markAsSeen(notification.id);
    }

    // Navigate based on type
    if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.postId) {
        navigate(`/post/${notification.postId}`);
      }
    } else if (notification.type === 'follow') {
      navigate(`/user/${notification.senderId}`);
    } else if (notification.type === 'message') {
      navigate(`/chat/${notification.chatId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-card rounded-xl border animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-300"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show only recent 5 notifications in dropdown
  const recentNotifications = notifications.slice(0, 5);

  if (recentNotifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Heart className="text-gray-400" size={24} />
        </div>
        <p className="text-gray-500 font-medium">No recent activity</p>
        <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentNotifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`flex items-center space-x-4 p-4 bg-card rounded-xl border hover:bg-gray-50 hover:scale-[1.02] transition-all duration-200 cursor-pointer group ${
            !notification.seen ? 'ring-2 ring-blue-200 bg-blue-50' : ''
          }`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
              <img 
                src={
                  notification.senderProfile?.avatar || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    notification.senderProfile?.displayName || 'User'
                  )}&background=eee&color=555&size=48`
                }
                alt={notification.senderProfile?.displayName || 'User'} 
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    notification.senderProfile?.displayName || 'User'
                  )}&background=eee&color=555&size=48`;
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border">
              {getActivityIcon(notification.type)}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold group-hover:text-primary transition-colors duration-200">
                {notification.senderProfile?.username || 'Unknown User'}
              </span>{' '}
              <span className="text-muted-foreground">
                {getNotificationMessage(notification)}
              </span>
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {getRelativeTime(notification.timestamp)}
              </p>
              {!notification.seen && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  •
                </Badge>
              )}
            </div>
          </div>
          
          {notification.postThumbnail && (
            <img 
              src={notification.postThumbnail} 
              alt="Post" 
              className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-200"
            />
          )}
        </div>
      ))}
      
      {notifications.length > 5 && (
        <div className="pt-2 border-t">
          <button
            onClick={() => navigate('/activity')}
            className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityDropdown;
