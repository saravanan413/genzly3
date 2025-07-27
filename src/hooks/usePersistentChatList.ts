
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToPersistentChatList, 
  ChatListEntry 
} from '../services/chat/persistentChatListService';
import { logger } from '../utils/logger';

export const usePersistentChatList = () => {
  const { currentUser } = useAuth();
  const [chatList, setChatList] = useState<ChatListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setChatList([]);
      setLoading(false);
      setError(null);
      return;
    }

    logger.debug('Setting up persistent chat list subscription', { userId: currentUser.uid });
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPersistentChatList(currentUser.uid, (chatListData) => {
      setChatList(chatListData);
      setLoading(false);
    });

    return () => {
      logger.debug('Cleaning up persistent chat list subscription');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return {
    chatList,
    loading,
    error
  };
};
