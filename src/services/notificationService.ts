
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendNotificationToUser } from './fcmService';

export const sendChatNotification = async (
  senderId: string, 
  receiverId: string, 
  message: string,
  senderName: string
) => {
  try {
    // Get receiver's FCM token
    const receiverDoc = await getDoc(doc(db, 'users', receiverId));
    if (receiverDoc.exists() && receiverDoc.data().fcmToken) {
      await sendNotificationToUser(
        receiverId,
        `New message from ${senderName}`,
        message,
        {
          type: 'chat',
          senderId,
          chatId: [senderId, receiverId].sort().join('_')
        }
      );
    }
  } catch (error) {
    console.error('Error sending chat notification:', error);
  }
};

export const sendFollowNotification = async (
  followerId: string,
  followedId: string,
  followerName: string
) => {
  try {
    const followedDoc = await getDoc(doc(db, 'users', followedId));
    if (followedDoc.exists() && followedDoc.data().fcmToken) {
      await sendNotificationToUser(
        followedId,
        'New Follower',
        `${followerName} started following you`,
        {
          type: 'follow',
          followerId
        }
      );
    }
  } catch (error) {
    console.error('Error sending follow notification:', error);
  }
};

export const sendLikeNotification = async (
  likerId: string,
  postOwnerId: string,
  likerName: string,
  postId: string
) => {
  try {
    if (likerId === postOwnerId) return; // Don't notify self
    
    const ownerDoc = await getDoc(doc(db, 'users', postOwnerId));
    if (ownerDoc.exists() && ownerDoc.data().fcmToken) {
      await sendNotificationToUser(
        postOwnerId,
        'New Like',
        `${likerName} liked your post`,
        {
          type: 'like',
          likerId,
          postId
        }
      );
    }
  } catch (error) {
    console.error('Error sending like notification:', error);
  }
};
