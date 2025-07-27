
import { 
  collection, 
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

export interface ChatListEntry {
  uid: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  updatedAt: any;
}

export interface ChatListData {
  [otherUserId: string]: ChatListEntry;
}

// Update chat list entry for a specific user
export const updateChatListEntry = async (
  userId: string,
  otherUserId: string,
  entry: Omit<ChatListEntry, 'uid'>
): Promise<void> => {
  try {
    const chatListRef = doc(db, 'chatList', userId, 'conversations', otherUserId);
    
    const chatListEntry: ChatListEntry = {
      uid: otherUserId,
      ...entry,
      updatedAt: serverTimestamp()
    };

    await setDoc(chatListRef, chatListEntry);
    logger.debug('Chat list entry updated', { userId, otherUserId });
  } catch (error) {
    logger.error('Error updating chat list entry', error);
    throw error;
  }
};

// Subscribe to user's chat list with real-time updates
export const subscribeToPersistentChatList = (
  userId: string,
  callback: (chatList: ChatListEntry[]) => void
): (() => void) => {
  if (!userId) {
    logger.debug('No userId provided for chat list subscription');
    callback([]);
    return () => {};
  }

  try {
    const conversationsRef = collection(db, 'chatList', userId, 'conversations');
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const chatList: ChatListEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as ChatListEntry;
        chatList.push(data);
      });

      logger.debug('Chat list updated', { userId, chatCount: chatList.length });
      callback(chatList);
    }, (error) => {
      logger.error('Error in chat list subscription', error);
      callback([]);
    });
  } catch (error) {
    logger.error('Error setting up chat list subscription', error);
    callback([]);
    return () => {};
  }
};

// Get user data for chat list entry
export const getUserDataForChatList = async (userId: string): Promise<{
  username: string;
  displayName: string;
  avatar?: string;
} | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        username: userData.username || userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
        displayName: userData.displayName || userData.username || 'Unknown User',
        avatar: userData.avatar
      };
    }
    return null;
  } catch (error) {
    logger.error('Error fetching user data for chat list', error);
    return null;
  }
};
