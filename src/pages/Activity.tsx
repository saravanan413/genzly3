
import React from 'react';
import { Heart, MessageCircle, UserPlus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useNotifications } from '../hooks/useNotifications';

const Activity = () => {
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
      <Layout>
        <div className="p-4">
          <div className="container mx-auto max-w-lg">
            <h1 className="text-2xl font-bold mb-6">Activity</h1>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-card rounded-lg border animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                  </div>
                  <div className="w-12 h-12 rounded bg-gray-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="container mx-auto max-w-lg">
          <h1 className="text-2xl font-bold mb-6">Activity</h1>
          
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Heart className="text-gray-400" size={32} />
              </div>
              <h3 className="text-gray-900 text-lg font-medium mb-2">No activity yet</h3>
              <p className="text-gray-500 text-sm">When people like, comment, or follow you, you'll see it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="flex items-center space-x-3 p-3 bg-card rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="relative">
                    <img 
                      src={
                        notification.senderProfile?.avatar || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          notification.senderProfile?.displayName || 'User'
                        )}&background=eee&color=555&size=40`
                      }
                      alt={notification.senderProfile?.displayName || 'User'} 
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          notification.senderProfile?.displayName || 'User'
                        )}&background=eee&color=555&size=40`;
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border">
                      {getActivityIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {notification.senderProfile?.username || 'Unknown User'}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        {getNotificationMessage(notification)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRelativeTime(notification.timestamp)}
                    </p>
                  </div>
                  
                  {notification.postThumbnail && (
                    <img 
                      src={notification.postThumbnail} 
                      alt="Post" 
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Activity;
