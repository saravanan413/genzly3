
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
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserProfile } from './firestoreService';

export interface Notification {
  id: string;
  receiverId: string;
  senderId: string;
  type: 'like' | 'follow' | 'comment' | 'message';
  title: string;
  message: string;
  postId?: string;
  text?: string;
  chatId?: string;
  seen: boolean;
  timestamp: any;
  // Populated fields
  senderProfile?: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  postThumbnail?: string;
}

export const createNotification = async (
  receiverId: string,
  senderId: string,
  type: 'like' | 'follow' | 'comment' | 'message',
  title: string,
  message: string,
  postId?: string,
  text?: string,
  chatId?: string
) => {
  try {
    // Don't create notification for self-actions
    if (receiverId === senderId) return;

    const notificationData = {
      receiverId,
      senderId,
      type,
      title,
      message,
      postId: postId || null,
      text: text || null,
      chatId: chatId || null,
      seen: false,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    console.log('Notification created successfully');
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const subscribeToNotifications = (
  receiverId: string, 
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('receiverId', '==', receiverId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const notifications: Notification[] = [];
    
    // Process notifications and populate sender data
    for (const docSnap of snapshot.docs) {
      const notificationData = docSnap.data();
      
      // Get sender profile
      const senderProfile = await getUserProfile(notificationData.senderId);
      
      // Get post thumbnail if it's a post-related notification
      let postThumbnail = null;
      if (notificationData.postId && (notificationData.type === 'like' || notificationData.type === 'comment')) {
        try {
          const postDoc = await getDoc(doc(db, 'posts', notificationData.postId));
          if (postDoc.exists()) {
            postThumbnail = postDoc.data().mediaURL;
          }
        } catch (error) {
          console.error('Error fetching post thumbnail:', error);
        }
      }

      notifications.push({
        id: docSnap.id,
        ...notificationData,
        senderProfile: senderProfile ? {
          username: senderProfile.username,
          displayName: senderProfile.displayName,
          avatar: senderProfile.avatar
        } : undefined,
        postThumbnail
      } as Notification);
    }
    
    callback(notifications);
  });
};

export const markNotificationAsSeen = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      seen: true
    });
  } catch (error) {
    console.error('Error marking notification as seen:', error);
  }
};

export const getUnreadNotificationsCount = async (receiverId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('receiverId', '==', receiverId),
      where('seen', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    return 0;
  }
};

// Helper functions to create specific types of notifications
export const createLikeNotification = async (
  receiverId: string,
  senderId: string,
  postId: string
) => {
  await createNotification(
    receiverId,
    senderId,
    'like',
    'New Like',
    'liked your post',
    postId
  );
};

export const createCommentNotification = async (
  receiverId: string,
  senderId: string,
  postId: string,
  commentText: string
) => {
  await createNotification(
    receiverId,
    senderId,
    'comment',
    'New Comment',
    'commented on your post',
    postId,
    commentText
  );
};

export const createFollowNotification = async (
  receiverId: string,
  senderId: string
) => {
  await createNotification(
    receiverId,
    senderId,
    'follow',
    'New Follower',
    'started following you'
  );
};
