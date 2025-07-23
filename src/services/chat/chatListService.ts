
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where
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
    const userChatsRef = collection(db, 'chatList', currentUserId, 'chats');
    const q = query(userChatsRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, async (snapshot) => {
      logger.debug('Chat list updated', { chatCount: snapshot.size });
      
      const chats: ChatListItem[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as ChatListMetadata;
        const receiverId = docSnapshot.id;
        
        // Get fresh user data if not cached in metadata
        let userData: UserData = {};
        if (data.userInfo?.name) {
          userData = {
            displayName: data.userInfo.name,
            avatar: data.userInfo.profileImage
          };
        } else {
          // Fetch user data from users collection
          try {
            const userDoc = await getDoc(doc(db, 'users', receiverId));
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
            logger.warn('Failed to fetch user data', { receiverId, error });
          }
        }

        // Create consistent chatId
        const sortedIds = [currentUserId, receiverId].sort();
        const chatId = sortedIds.join('_');

        const chatItem: ChatListItem = {
          chatId,
          receiverId,
          username: userData.username || userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
          displayName: userData.displayName || userData.username || 'Unknown User',
          avatar: userData.avatar,
          lastMessage: data.lastMessage || 'No messages yet',
          timestamp: data.timestamp || Date.now(),
          seen: data.seen || false
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

    const timestamp = Date.now();

    // Update sender's chat list - save receiver's info
    const senderChatMetadata: ChatListMetadata = {
      lastMessage: lastMessage || 'Media message',
      timestamp: timestamp,
      userInfo: {
        name: receiverData?.displayName || receiverData?.username || 'Unknown',
        profileImage: receiverData?.avatar || undefined
      },
      seen: true // Sender has seen their own message
    };

    await setDoc(doc(db, 'chatList', senderId, 'chats', receiverId), senderChatMetadata, { merge: true });

    // Update receiver's chat list - save sender's info
    const receiverChatMetadata: ChatListMetadata = {
      lastMessage: lastMessage || 'Media message',
      timestamp: timestamp,
      userInfo: {
        name: senderData?.displayName || senderData?.username || 'Unknown',
        profileImage: senderData?.avatar || undefined
      },
      seen: false // Receiver hasn't seen the message yet
    };

    await setDoc(doc(db, 'chatList', receiverId, 'chats', senderId), receiverChatMetadata, { merge: true });

    logger.info('Chat lists updated successfully for both users');
  } catch (error) {
    logger.error('Error updating chat lists', error);
    throw error;
  }
};

// Helper function to ensure chat list entries exist for new conversations
export const initializeChat = async (userId1: string, userId2: string) => {
  try {
    // Check if chat list entries already exist
    const [user1ChatRef, user2ChatRef] = [
      doc(db, 'chatList', userId1, 'chats', userId2),
      doc(db, 'chatList', userId2, 'chats', userId1)
    ];

    const [user1Chat, user2Chat] = await Promise.all([
      getDoc(user1ChatRef),
      getDoc(user2ChatRef)
    ]);

    // If either doesn't exist, create initial entries
    if (!user1Chat.exists() || !user2Chat.exists()) {
      await updateChatListForUsers(userId1, userId2, '', 'text');
    }
  } catch (error) {
    logger.error('Error initializing chat', error);
  }
};
