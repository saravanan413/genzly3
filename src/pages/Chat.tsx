
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatHeader from '../components/chat/ChatHeader';
import ChatList from '../components/chat/ChatList';
import { useAuth } from '../contexts/AuthContext';
import { usePersistentChatList } from '../hooks/usePersistentChatList';
import { logger } from '../utils/logger';

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [likedChats, setLikedChats] = useState<string[]>([]);
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { chatList, loading, error } = usePersistentChatList();

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

  // Convert persistent chat list to ChatPreview format
  const chatPreviews = chatList.map(chat => ({
    chatId: `${currentUser?.uid}_${chat.uid}`,
    otherUser: {
      id: chat.uid,
      username: chat.username,
      displayName: chat.displayName,
      avatar: chat.avatar
    },
    lastMessage: chat.lastMessage ? {
      text: chat.lastMessage,
      timestamp: chat.updatedAt,
      senderId: chat.uid,
      seen: true // We'll handle this later if needed
    } : null,
    unreadCount: 0 // We'll handle this later if needed
  }));

  if (authLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-6 w-full bg-background dark:bg-gray-900">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

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

          <ChatList
            chatPreviews={chatPreviews}
            loading={loading}
            searchQuery={searchQuery}
            currentUserId={currentUser.uid}
            onChatClick={handleChatClick}
            onDoubleTap={handleDoubleTap}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
