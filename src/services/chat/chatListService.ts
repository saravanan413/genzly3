
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

export interface ChatListItem {
  chatId: string;
  receiverId: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  timestamp: number;
  seen: boolean;
}

interface UserData {
  username?: string;
  displayName?: string;
  avatar?: string;
  email?: string;
}

export const subscribeToUserChatList = (
  currentUserId: string, 
  callback: (chats: ChatListItem[]) => void
) => {
  logger.debug('Setting up persistent chat list subscription', { userId: currentUserId });
  
  if (!currentUserId) {
    logger.error('No currentUserId provided to subscribeToUserChatList');
    callback([]);
    return () => {};
  }

  try {
    // Query the main chats collection where the current user is in the users array
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('users', 'array-contains', currentUserId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, async (snapshot) => {
      logger.debug('Persistent chat list updated', { chatCount: snapshot.size });
      
      const chats: ChatListItem[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const chatData = docSnapshot.data();
        const chatId = docSnapshot.id;
        
        logger.debug('Processing persistent chat document', { 
          chatId, 
          users: chatData.users,
          hasLastMessage: !!chatData.lastMessage?.text,
          lastMessagePreview: chatData.lastMessage?.text?.substring(0, 30) + '...'
        });
        
        // Skip chats without users array or if user is not in it
        if (!chatData.users || !Array.isArray(chatData.users) || !chatData.users.includes(currentUserId)) {
          logger.debug('Skipping chat - user not in users array', { chatId, users: chatData.users });
          continue;
        }
        
        // Get the other user's ID
        const otherUserId = chatData.users.find((id: string) => id !== currentUserId);
        if (!otherUserId) {
          logger.debug('Skipping chat - no other user found', { chatId, users: chatData.users });
          continue;
        }
        
        // Skip chats without a last message (empty chats)
        if (!chatData.lastMessage?.text || chatData.lastMessage.text.trim() === '') {
          logger.debug('Skipping empty chat', { chatId });
          continue;
        }
        
        // Get user data for the other user
        let userData: UserData = {};
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userDocData = userDoc.data();
            userData = {
              username: userDocData.username,
              displayName: userDocData.displayName,
              avatar: userDocData.avatar,
              email: userDocData.email
            };
          } else {
            logger.warn('Other user document not found', { otherUserId });
            continue;
          }
        } catch (error) {
          logger.warn('Failed to fetch other user data', { otherUserId, error });
          continue;
        }

        const chatItem: ChatListItem = {
          chatId,
          receiverId: otherUserId,
          username: userData.username || userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
          displayName: userData.displayName || userData.username || 'Unknown User',
          avatar: userData.avatar,
          lastMessage: chatData.lastMessage.text,
          timestamp: chatData.lastMessage.timestamp?.toDate?.()?.getTime() || chatData.updatedAt?.toDate?.()?.getTime() || Date.now(),
          seen: chatData.lastMessage.senderId === currentUserId || chatData.lastMessage.seen === true
        };

        chats.push(chatItem);
        logger.debug('Added persistent chat to list', { 
          chatId, 
          otherUser: userData.username || userData.displayName,
          lastMessage: chatItem.lastMessage.substring(0, 30) + '...',
          timestamp: new Date(chatItem.timestamp).toISOString()
        });
      }

      logger.debug('Final persistent chat list', { chatCount: chats.length });
      callback(chats);
    }, (error) => {
      logger.error('Error in persistent chat list subscription', error);
      callback([]);
    });
  } catch (error) {
    logger.error('Error setting up persistent chat list subscription', error);
    callback([]);
    return () => {};
  }
};
