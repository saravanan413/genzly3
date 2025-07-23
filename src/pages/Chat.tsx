
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatHeader from '../components/chat/ChatHeader';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserChatList, ChatListItem } from '../services/chat/chatListService';
import { MessageCircle } from 'lucide-react';
import HeartAnimation from '../components/HeartAnimation';
import { logger } from '../utils/logger';

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [likedChats, setLikedChats] = useState<string[]>([]);
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Subscribe to user's chat list with real-time updates
  useEffect(() => {
    if (!currentUser?.uid) {
      logger.debug('No current user, cannot load chat list');
      setLoading(false);
      setError(null);
      setChatList([]);
      return;
    }

    logger.debug('Setting up real-time chat list subscription', { userId: currentUser.uid });
    setLoading(true);
    setError(null);
    
    try {
      const unsubscribe = subscribeToUserChatList(currentUser.uid, (chats) => {
        logger.debug('Real-time chat list update received', { chatCount: chats.length });
        setChatList(chats);
        setLoading(false);
        setError(null);
      });

      return () => {
        logger.debug('Cleaning up chat list subscription');
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (err) {
      logger.error('Failed to set up chat list subscription', err);
      setError('Failed to load chat list');
      setLoading(false);
    }
  }, [currentUser?.uid]);

  const handleDoubleTap = (receiverId: string) => {
    if (!likedChats.includes(receiverId)) {
      setLikedChats(prev => [...prev, receiverId]);
      setTimeout(() => {
        setLikedChats(prev => prev.filter(id => id !== receiverId));
      }, 2000);
    }
  };

  const handleChatClick = (receiverId: string) => {
    logger.debug('Opening chat', { receiverId });
    navigate(`/chat/${receiverId}`);
  };

  const handleNewChat = () => {
    navigate('/explore');
  };

  const filteredChats = chatList.filter(chat =>
    chat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
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

  const getAvatarUrl = (avatar?: string, displayName?: string): string => {
    return avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=ccc&color=333`;
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="p-4 md:p-6 w-full bg-background dark:bg-gray-900">
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Please log in to view your chats.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-6 w-full bg-background dark:bg-gray-900">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 w-full bg-background dark:bg-gray-900">
        <div className="w-full max-w-2xl mx-auto">
          <ChatHeader onNewChat={handleNewChat} />
          
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-primary/20 placeholder-gray-500"
              />
            </div>
          </div>

          {loading ? (
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
          ) : filteredChats.length === 0 ? (
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
                  onClick={handleNewChat}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Find people to chat with
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => {
                const avatarUrl = getAvatarUrl(chat.avatar, chat.displayName);
                
                return (
                  <HeartAnimation 
                    key={chat.receiverId}
                    onDoubleClick={() => handleDoubleTap(chat.receiverId)}
                  >
                    <div 
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
                      onClick={() => handleChatClick(chat.receiverId)}
                    >
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5 flex-shrink-0">
                          <img
                            src={avatarUrl}
                            alt={chat.displayName}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = getAvatarUrl(undefined, chat.displayName);
                            }}
                          />
                        </div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors duration-200">
                            {chat.displayName}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(chat.timestamp)}
                            </span>
                            {!chat.seen && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {chat.lastMessage.length > 50 
                              ? `${chat.lastMessage.substring(0, 50)}...`
                              : chat.lastMessage
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </HeartAnimation>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
