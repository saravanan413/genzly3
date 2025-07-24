
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ChatListMetadata } from '../../types/chat';
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
  logger.debug('Setting up chat list subscription', { userId: currentUserId });
  
  if (!currentUserId) {
    logger.error('No currentUserId provided to subscribeToUserChatList');
    callback([]);
    return () => {};
  }

  try {
    // Query chats where the current user is a participant
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('users', 'array-contains', currentUserId),
      orderBy('lastMessage.timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, async (snapshot) => {
      logger.debug('Chat list updated', { chatCount: snapshot.size });
      
      const chats: ChatListItem[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const chatData = docSnapshot.data();
        const chatId = docSnapshot.id;
        
        // Get the other user's ID
        const otherUserId = chatData.users?.find((id: string) => id !== currentUserId);
        if (!otherUserId) continue;
        
        // Skip if no last message exists
        if (!chatData.lastMessage?.text) continue;
        
        // Get user data
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
          }
        } catch (error) {
          logger.warn('Failed to fetch user data', { otherUserId, error });
          continue;
        }

        const chatItem: ChatListItem = {
          chatId,
          receiverId: otherUserId,
          username: userData.username || userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
          displayName: userData.displayName || userData.username || 'Unknown User',
          avatar: userData.avatar,
          lastMessage: chatData.lastMessage.text || 'No messages yet',
          timestamp: chatData.lastMessage.timestamp?.toDate?.()?.getTime() || Date.now(),
          seen: chatData.lastMessage.senderId === currentUserId || chatData.lastMessage.seen === true
        };

        chats.push(chatItem);
      }

      logger.debug('Processed chat list', { chatCount: chats.length });
      callback(chats);
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

export const updateChatListForUsers = async (
  senderId: string,
  receiverId: string,
  lastMessage: string,
  messageType: string = 'text'
) => {
  try {
    logger.debug('Updating chat list for both users', { senderId, receiverId });
    
    // Create consistent chatId
    const sortedIds = [senderId, receiverId].sort();
    const chatId = sortedIds.join('_');
    
    // Get user data for both sender and receiver
    const [senderDoc, receiverDoc] = await Promise.all([
      getDoc(doc(db, 'users', senderId)),
      getDoc(doc(db, 'users', receiverId))
    ]);

    const senderData = senderDoc.exists() ? senderDoc.data() : null;
    const receiverData = receiverDoc.exists() ? receiverDoc.data() : null;

    if (!senderData || !receiverData) {
      logger.warn('Missing user data for chat list update', { 
        senderExists: !!senderData, 
        receiverExists: !!receiverData 
      });
    }

    const timestamp = new Date();

    // Update the main chat document
    const chatData = {
      users: [senderId, receiverId],
      lastMessage: {
        text: lastMessage || 'Media message',
        timestamp: timestamp,
        senderId: senderId,
        seen: false
      },
      updatedAt: timestamp
    };

    await setDoc(doc(db, 'chats', chatId), chatData, { merge: true });

    logger.info('Chat document updated successfully');
  } catch (error) {
    logger.error('Error updating chat lists', error);
    throw error;
  }
};

// Helper function to ensure chat exists for new conversations
export const initializeChat = async (userId1: string, userId2: string) => {
  try {
    const sortedIds = [userId1, userId2].sort();
    const chatId = sortedIds.join('_');
    
    // Check if chat already exists
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (!chatDoc.exists()) {
      await setDoc(doc(db, 'chats', chatId), {
        users: [userId1, userId2],
        lastMessage: {
          text: '',
          timestamp: new Date(),
          senderId: '',
          seen: true
        },
        createdAt: new Date()
      });
    }
  } catch (error) {
    logger.error('Error initializing chat', error);
  }
};
