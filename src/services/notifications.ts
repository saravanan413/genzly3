
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'follow' | 'comment' | 'message';
  title: string;
  message: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  postId?: string;
  chatId?: string;
  read: boolean;
  createdAt: any;
}

export const createNotification = async (
  userId: string,
  type: 'like' | 'follow' | 'comment' | 'message',
  title: string,
  message: string,
  fromUserId: string,
  fromUsername: string,
  fromAvatar?: string,
  postId?: string,
  chatId?: string
) => {
  try {
    const notificationData = {
      userId,
      type,
      title,
      message,
      fromUserId,
      fromUsername,
      fromAvatar: fromAvatar || null,
      postId: postId || null,
      chatId: chatId || null,
      read: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    console.log('Notification created');
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    
    callback(notifications);
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
