
import React from 'react';
import { Search, Edit, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatHeaderProps {
  onNewChat?: () => void;
  user?: {
    name: string;
    avatar: string;
  };
  isOnline?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onNewChat, user, isOnline }) => {
  const navigate = useNavigate();

  // If user prop is provided, show individual chat header
  if (user) {
    return (
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/chat')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground dark:text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground dark:text-white">{user.name}</h2>
              {isOnline && <p className="text-xs text-green-500">Online</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default chat list header
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">Messages</h1>
      {onNewChat && (
        <button 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          onClick={onNewChat}
        >
          <Edit size={20} className="text-foreground dark:text-white" />
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
