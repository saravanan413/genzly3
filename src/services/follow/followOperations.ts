
import { 
  doc, 
  writeBatch,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { sendFollowRequest, cancelFollowRequest } from '../privacy/privacyService';

export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    console.log('Cannot follow yourself');
    return false;
  }

  try {
    console.log('Starting follow operation:', { currentUserId, targetUserId });
    
    // Get user profiles first to ensure they exist
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      getDoc(doc(db, 'users', currentUserId)),
      getDoc(doc(db, 'users', targetUserId))
    ]);
    
    if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
      console.error('User documents not found');
      return false;
    }

    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();

    // Check if target user has private account
    if (targetUserData.isPrivate) {
      console.log('Target user has private account, sending follow request');
      return await sendFollowRequest(currentUserId, targetUserId);
    }

    console.log('User data loaded, proceeding with follow operation');

    // Use batch write for atomic operations
    const batch = writeBatch(db);

    // Create document at /users/{targetUserId}/followers/{currentUserId}
    const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
    batch.set(followersRef, {
      uid: currentUserId,
      username: currentUserData.username || 'Unknown',
      displayName: currentUserData.displayName || 'Unknown User',
      avatar: currentUserData.avatar || null,
      timestamp: serverTimestamp()
    });

    // Create document at /users/{currentUserId}/following/{targetUserId}
    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    batch.set(followingRef, {
      uid: targetUserId,
      username: targetUserData.username || 'Unknown',
      displayName: targetUserData.displayName || 'Unknown User',
      avatar: targetUserData.avatar || null,
      timestamp: serverTimestamp()
    });

    await batch.commit();
    console.log('Follow operation completed successfully');
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  try {
    console.log('Starting unfollow operation:', { currentUserId, targetUserId });
    
    // Check if this is a follow request that needs to be cancelled
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    if (targetUserDoc.exists() && targetUserDoc.data().isPrivate) {
      // Try to cancel follow request first
      await cancelFollowRequest(currentUserId, targetUserId);
    }
    
    // Use batch write for atomic operations
    const batch = writeBatch(db);

    // Delete from /users/{targetUserId}/followers/{currentUserId}
    const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
    batch.delete(followersRef);
    
    // Delete from /users/{currentUserId}/following/{targetUserId}
    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    batch.delete(followingRef);

    await batch.commit();
    console.log('Unfollow operation completed successfully');
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};
