
import React from 'react';
import { Plus, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

interface ChatUser {
  name: string;
  avatar: string;
}

interface ChatHeaderProps {
  onNewChat?: () => void;
  user?: ChatUser;
  isOnline?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onNewChat, user, isOnline }) => {
  const { totalUnreadCount, hasUnreadMessages } = useUnreadMessages();
  const navigate = useNavigate();

  // Individual chat header
  if (user) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/chat')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Back to chat list"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{user.name}</h2>
            {isOnline && (
              <p className="text-sm text-green-500">Online</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main chat list header
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <MessageCircle size={28} className="text-gray-900 dark:text-white" />
          {hasUnreadMessages && (
            <NotificationBadge 
              count={totalUnreadCount} 
              size="sm"
              className="animate-pulse"
            />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
      </div>
      
      {onNewChat && (
        <button
          onClick={onNewChat}
          className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          aria-label="Start new chat"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
