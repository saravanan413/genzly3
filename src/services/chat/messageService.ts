
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc,
  serverTimestamp,
  writeBatch,
  where,
  getDocs,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ChatMessage } from '../../types/chat';
import { updateChatListForUsers, initializeChat } from './chatListService';
import { logger } from '../../utils/logger';

interface MessageData {
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: ReturnType<typeof serverTimestamp>;
  seen: boolean;
  status: 'sent' | 'delivered' | 'seen';
  type: 'text' | 'voice' | 'image' | 'video';
  mediaURL: string | null;
}

export const subscribeToChatMessages = (
  chatId: string, 
  callback: (messages: ChatMessage[]) => void,
  messageLimit: number = 100
) => {
  logger.debug('Setting up real-time message subscription', { chatId });
  
  if (!chatId) {
    logger.debug('No chatId provided for message subscription');
    callback([]);
    return () => {};
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  
  const q = query(
    messagesRef, 
    orderBy('timestamp', 'asc'),
    limit(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    logger.debug('Real-time messages update', { messageCount: snapshot.size });
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        text: data.text || '',
        senderId: data.senderId,
        receiverId: data.receiverId,
        timestamp: data.timestamp,
        seen: data.seen || false,
        status: data.status || 'sent',
        type: data.type || 'text',
        mediaURL: data.mediaURL || null,
        delivered: true
      } as ChatMessage;
    });
    
    logger.debug('Processed messages for callback', { messageCount: messages.length });
    callback(messages);
  }, (error) => {
    logger.error('Error in message subscription', error);
    callback([]);
  });
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string,
  type: 'text' | 'voice' | 'image' | 'video' = 'text',
  mediaURL?: string
): Promise<string> => {
  logger.debug('Sending message to Firestore', {
    chatId,
    senderId,
    receiverId,
    messagePreview: text.substring(0, 50) + '...',
    type
  });

  if (!chatId || !senderId || !receiverId) {
    throw new Error('Missing required parameters for sending message');
  }

  if (!text.trim() && !mediaURL) {
    throw new Error('Message must have text or media');
  }

  try {
    // Initialize chat list entries if this is a new conversation
    await initializeChat(senderId, receiverId);

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    const messageData: MessageData = {
      text: text.trim(),
      senderId,
      receiverId,
      timestamp: serverTimestamp(),
      seen: false,
      status: 'sent',
      type,
      mediaURL: mediaURL || null
    };

    logger.debug('Saving message to Firestore...');
    
    // First save the message and wait for it to complete
    const docRef = await addDoc(messagesRef, messageData);
    logger.debug('Message saved', { messageId: docRef.id });

    // Then update chat lists for both users
    await updateChatListForUsers(senderId, receiverId, text.trim(), type);
    
    return docRef.id;
  } catch (error) {
    logger.error('Failed to send message', error);
    throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const markMessagesAsSeen = async (chatId: string, userId: string) => {
  try {
    logger.debug('Marking messages as seen', { chatId, userId });
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef, 
      where('receiverId', '==', userId),
      where('seen', '==', false)
    );
    
    const snapshot = await getDocs(q);
    logger.debug('Messages to mark as seen', { messageCount: snapshot.size });
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnapshot => {
      batch.update(doc(db, 'chats', chatId, 'messages', docSnapshot.id), { 
        seen: true,
        status: 'seen'
      });
    });
    
    await batch.commit();
    logger.debug('Messages marked as seen');

    // Update chat list to show as seen
    const otherUserId = chatId.split('_').find(id => id !== userId);
    if (otherUserId) {
      await updateDoc(doc(db, 'chatList', userId, 'chats', otherUserId), {
        seen: true
      });
    }
  } catch (error) {
    logger.error('Error marking messages as seen', error);
  }
};
