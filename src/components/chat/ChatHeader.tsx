
import React from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import NotificationBadge from './NotificationBadge';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

interface ChatHeaderProps {
  onNewChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onNewChat }) => {
  const { totalUnreadCount, hasUnreadMessages } = useUnreadMessages();

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
      
      <button
        onClick={onNewChat}
        className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
        aria-label="Start new chat"
      >
        <Plus size={20} />
      </button>
    </div>
  );
};

export default ChatHeader;
