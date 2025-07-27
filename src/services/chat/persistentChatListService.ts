
import { 
  collection, 
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

export interface PersistentChatListItem {
  uid: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  updatedAt: any;
}

export const updateChatList = async (
  currentUserId: string,
  otherUserId: string,
  otherUserData: {
    username: string;
    displayName: string;
    avatar?: string;
  },
  lastMessage: string
): Promise<void> => {
  try {
    logger.debug('Updating chat list for both users', {
      currentUserId,
      otherUserId,
      messagePreview: lastMessage.substring(0, 50)
    });

    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    // Update current user's chat list
    const currentUserChatRef = doc(db, 'chatList', currentUserId, 'conversations', otherUserId);
    batch.set(currentUserChatRef, {
      uid: otherUserId,
      username: otherUserData.username,
      displayName: otherUserData.displayName,
      avatar: otherUserData.avatar || null,
      lastMessage: lastMessage,
      updatedAt: timestamp
    });

    // We need to get current user's data to update other user's chat list
    // For now, we'll use a simplified approach - this should be enhanced to get actual user data
    const currentUserChatRef2 = doc(db, 'chatList', otherUserId, 'conversations', currentUserId);
    batch.set(currentUserChatRef2, {
      uid: currentUserId,
      username: 'You', // This should be replaced with actual current user data
      displayName: 'You', // This should be replaced with actual current user data
      avatar: null, // This should be replaced with actual current user data
      lastMessage: lastMessage,
      updatedAt: timestamp
    });

    await batch.commit();
    logger.debug('Chat list updated successfully for both users');
  } catch (error) {
    logger.error('Error updating chat list', error);
    throw error;
  }
};

export const subscribeToUserChatList = (
  userId: string,
  callback: (chatList: PersistentChatListItem[]) => void
): (() => void) => {
  if (!userId) {
    logger.error('No userId provided for chat list subscription');
    callback([]);
    return () => {};
  }

  logger.debug('Setting up persistent chat list subscription', { userId });

  const conversationsRef = collection(db, 'chatList', userId, 'conversations');
  const q = query(conversationsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    logger.debug('Chat list updated', { chatCount: snapshot.size });
    
    const chatList = snapshot.docs.map(doc => ({
      uid: doc.data().uid,
      username: doc.data().username,
      displayName: doc.data().displayName,
      avatar: doc.data().avatar,
      lastMessage: doc.data().lastMessage,
      updatedAt: doc.data().updatedAt
    })) as PersistentChatListItem[];

    callback(chatList);
  }, (error) => {
    logger.error('Error in chat list subscription', error);
    callback([]);
  });
};
