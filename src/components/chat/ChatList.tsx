
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeartAnimation from '../HeartAnimation';
import { ChatPreview } from '../../services/chat';
import { FirebaseTimestamp } from '../../types/chat';

interface ChatListProps {
  chatPreviews: ChatPreview[];
  loading: boolean;
  searchQuery: string;
  currentUserId: string;
  onChatClick: (userId: string) => void;
  onDoubleTap: (userId: string) => void;
}

interface MessageData {
  text?: string;
  timestamp?: FirebaseTimestamp | number;
  senderId?: string;
}

const ChatList: React.FC<ChatListProps> = ({
  chatPreviews,
  loading,
  searchQuery,
  currentUserId,
  onChatClick,
  onDoubleTap
}) => {
  const navigate = useNavigate();

  const filteredChats = chatPreviews.filter(chat =>
    chat.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastMessage = (message: MessageData | null): string => {
    if (!message || !message.text) {
      return 'No messages yet';
    }
    
    const maxLength = 50;
    return message.text.length > maxLength 
      ? `${message.text.substring(0, maxLength)}...`
      : message.text;
  };

  const formatTime = (timestamp: FirebaseTimestamp | number | undefined): string => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
        date = timestamp.toDate();
      } else {
        return '';
      }

      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'now';
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  // Generate default avatar
  const getFallbackAvatar = (): string => {
    return '/lovable-uploads/98d32147-be3a-40f0-b0eb-eb68adf3c432.png';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 rounded-xl">
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <MessageCircle size={48} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No chats yet</h3>
        <p className="text-gray-500 text-center max-w-sm">
          {searchQuery 
            ? `No chats found for "${searchQuery}"`
            : "When you start chatting with people, they'll appear here."
          }
        </p>
        {!searchQuery && (
          <button
            onClick={() => navigate('/explore')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Find people to chat with
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredChats.map((chat) => {
        const avatarUrl = chat.otherUser.avatar || getFallbackAvatar();
        
        return (
          <HeartAnimation 
            key={`${chat.otherUser.id}-${chat.chatId}`}
            onDoubleClick={() => onDoubleTap(chat.otherUser.id)}
          >
            <div 
              className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => onChatClick(chat.otherUser.id)}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5 flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt={chat.otherUser.displayName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getFallbackAvatar();
                    }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors duration-200">
                    {chat.otherUser.displayName || chat.otherUser.username}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(chat.lastMessage?.timestamp)}
                    </span>
                    {!chat.lastMessage?.seen && chat.lastMessage?.senderId !== currentUserId && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {chat.lastMessage?.senderId === currentUserId && "You: "}
                    {formatLastMessage(chat.lastMessage)}
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </HeartAnimation>
        );
      })}
    </div>
  );
};

export default ChatList;
