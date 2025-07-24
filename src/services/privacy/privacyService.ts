import { 
  doc, 
  collection, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  getDoc,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';

export interface FollowRequest {
  id: string;
  requesterId: string;
  requesterInfo: {
    uid: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  timestamp: any;
}

export interface BlockedUser {
  id: string;
  blockedUserId: string;
  blockedUserInfo: {
    uid: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  timestamp: any;
}

// Send follow request to private account
export const sendFollowRequest = async (currentUserId: string, targetUserId: string) => {
  try {
    // Get current user profile
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserDoc.exists()) {
      throw new Error('Current user not found');
    }
    
    const currentUserData = currentUserDoc.data();
    
    // Add request to target user's follow requests
    const followRequestsRef = collection(db, 'users', targetUserId, 'followRequests');
    await addDoc(followRequestsRef, {
      requesterId: currentUserId,
      requesterInfo: {
        uid: currentUserId,
        username: currentUserData.username || 'Unknown',
        displayName: currentUserData.displayName || 'Unknown User',
        avatar: currentUserData.avatar || null
      },
      timestamp: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error sending follow request:', error);
    return false;
  }
};

// Cancel follow request
export const cancelFollowRequest = async (currentUserId: string, targetUserId: string) => {
  try {
    const followRequestsRef = collection(db, 'users', targetUserId, 'followRequests');
    const q = query(followRequestsRef, where('requesterId', '==', currentUserId));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error canceling follow request:', error);
    return false;
  }
};

// Get follow requests for a user
export const getFollowRequests = async (userId: string): Promise<FollowRequest[]> => {
  try {
    const followRequestsRef = collection(db, 'users', userId, 'followRequests');
    const snapshot = await getDocs(followRequestsRef);
    
    const requests: FollowRequest[] = [];
    snapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      } as FollowRequest);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting follow requests:', error);
    return [];
  }
};

// Accept follow request
export const acceptFollowRequest = async (currentUserId: string, requesterId: string) => {
  try {
    const batch = writeBatch(db);
    
    // Get requester data
    const requesterDoc = await getDoc(doc(db, 'users', requesterId));
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    
    if (!requesterDoc.exists() || !currentUserDoc.exists()) {
      throw new Error('User documents not found');
    }
    
    const requesterData = requesterDoc.data();
    const currentUserData = currentUserDoc.data();
    
    // Add to followers
    const followersRef = doc(db, 'users', currentUserId, 'followers', requesterId);
    batch.set(followersRef, {
      uid: requesterId,
      username: requesterData.username || 'Unknown',
      displayName: requesterData.displayName || 'Unknown User',
      avatar: requesterData.avatar || null,
      timestamp: serverTimestamp()
    });
    
    // Add to following
    const followingRef = doc(db, 'users', requesterId, 'following', currentUserId);
    batch.set(followingRef, {
      uid: currentUserId,
      username: currentUserData.username || 'Unknown',
      displayName: currentUserData.displayName || 'Unknown User',
      avatar: currentUserData.avatar || null,
      timestamp: serverTimestamp()
    });
    
    // Remove from follow requests
    const followRequestsRef = collection(db, 'users', currentUserId, 'followRequests');
    const q = query(followRequestsRef, where('requesterId', '==', requesterId));
    const snapshot = await getDocs(q);
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error accepting follow request:', error);
    return false;
  }
};

// Reject follow request
export const rejectFollowRequest = async (currentUserId: string, requesterId: string) => {
  try {
    const followRequestsRef = collection(db, 'users', currentUserId, 'followRequests');
    const q = query(followRequestsRef, where('requesterId', '==', requesterId));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error rejecting follow request:', error);
    return false;
  }
};

// Block user with comprehensive cleanup and proper auth checks
export const blockUser = async (currentUserId: string, targetUserId: string) => {
  // Check if user is authenticated
  if (!auth.currentUser) {
    console.error('No authenticated user found');
    return { success: false, message: 'You must be signed in to block users' };
  }

  // Ensure currentUserId matches authenticated user
  if (currentUserId !== auth.currentUser.uid) {
    console.error('Authentication mismatch:', {
      providedUserId: currentUserId,
      authenticatedUserId: auth.currentUser.uid
    });
    return { success: false, message: 'Authentication error. Please sign in again.' };
  }

  if (!currentUserId || !targetUserId) {
    console.error('Invalid user IDs provided');
    return { success: false, message: 'Invalid user information provided' };
  }

  if (currentUserId === targetUserId) {
    console.error('Cannot block yourself');
    return { success: false, message: 'You cannot block yourself' };
  }

  try {
    console.log('Starting block user operation with authentication check:', {
      currentUserId,
      targetUserId,
      authenticatedUserId: auth.currentUser.uid,
      userEmail: auth.currentUser.email
    });
    
    // Check if already blocked
    const blockedUserPath = `/users/${currentUserId}/blockedUsers/${targetUserId}`;
    console.log('Checking if user is already blocked at path:', blockedUserPath);
    
    const blockedUserDoc = await getDoc(doc(db, 'users', currentUserId, 'blockedUsers', targetUserId));
    if (blockedUserDoc.exists()) {
      console.log('User is already blocked');
      return { success: false, message: 'User is already blocked' };
    }

    // Get target user data
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    if (!targetUserDoc.exists()) {
      console.error('Target user not found');
      return { success: false, message: 'User not found' };
    }
    
    const targetUserData = targetUserDoc.data();
    
    // Use batch for all operations
    const batch = writeBatch(db);
    
    // Add to blocked users collection - ensure path matches security rules
    const blockedUsersRef = doc(db, 'users', currentUserId, 'blockedUsers', targetUserId);
    console.log('Writing to blocked users path:', blockedUsersRef.path);
    console.log('Document data being written:', {
      uid: targetUserId,
      blockedUserId: targetUserId,
      blockedUserInfo: {
        uid: targetUserId,
        username: targetUserData.username || 'Unknown',
        displayName: targetUserData.displayName || 'Unknown User',
        avatar: targetUserData.avatar || null
      }
    });
    
    batch.set(blockedUsersRef, {
      uid: targetUserId,
      blockedUserId: targetUserId,
      blockedUserInfo: {
        uid: targetUserId,
        username: targetUserData.username || 'Unknown',
        displayName: targetUserData.displayName || 'Unknown User',
        avatar: targetUserData.avatar || null
      },
      blockedAt: serverTimestamp(),
      timestamp: serverTimestamp()
    });

    // Check and clean up existing relationships
    const [
      currentUserFollowersDoc,
      currentUserFollowingDoc,
      targetUserFollowersDoc,
      targetUserFollowingDoc
    ] = await Promise.all([
      getDoc(doc(db, 'users', currentUserId, 'followers', targetUserId)),
      getDoc(doc(db, 'users', currentUserId, 'following', targetUserId)),
      getDoc(doc(db, 'users', targetUserId, 'followers', currentUserId)),
      getDoc(doc(db, 'users', targetUserId, 'following', currentUserId))
    ]);

    console.log('Relationship cleanup status:', {
      currentUserFollowersDoc: currentUserFollowersDoc.exists(),
      currentUserFollowingDoc: currentUserFollowingDoc.exists(),
      targetUserFollowersDoc: targetUserFollowersDoc.exists(),
      targetUserFollowingDoc: targetUserFollowingDoc.exists()
    });

    // Remove from current user's followers if exists
    if (currentUserFollowersDoc.exists()) {
      console.log('Removing from current user followers');
      batch.delete(doc(db, 'users', currentUserId, 'followers', targetUserId));
    }
    
    // Remove from current user's following if exists
    if (currentUserFollowingDoc.exists()) {
      console.log('Removing from current user following');
      batch.delete(doc(db, 'users', currentUserId, 'following', targetUserId));
    }
    
    // Remove from target user's followers if exists
    if (targetUserFollowersDoc.exists()) {
      console.log('Removing from target user followers');
      batch.delete(doc(db, 'users', targetUserId, 'followers', currentUserId));
    }
    
    // Remove from target user's following if exists
    if (targetUserFollowingDoc.exists()) {
      console.log('Removing from target user following');
      batch.delete(doc(db, 'users', targetUserId, 'following', currentUserId));
    }
    
    // Remove any follow requests from both sides
    const [followRequestsSnapshot, targetFollowRequestsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'users', currentUserId, 'followRequests'), where('requesterId', '==', targetUserId))),
      getDocs(query(collection(db, 'users', targetUserId, 'followRequests'), where('requesterId', '==', currentUserId)))
    ]);
    
    console.log('Follow requests cleanup:', {
      followRequestsToRemove: followRequestsSnapshot.size,
      targetFollowRequestsToRemove: targetFollowRequestsSnapshot.size
    });
    
    followRequestsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    targetFollowRequestsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    console.log('Committing batch operation...');
    await batch.commit();
    
    console.log('Block user operation completed successfully');
    return { success: true, message: 'User blocked successfully' };
  } catch (error: any) {
    console.error('Error blocking user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Current user auth state:', {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isAuthenticated: !!auth.currentUser
    });
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      console.error('Permission denied - checking auth state and document path');
      return { success: false, message: 'Permission denied. Please make sure you are signed in and try again.' };
    } else if (error.code === 'unavailable') {
      return { success: false, message: 'Service temporarily unavailable. Please try again later.' };
    } else if (error.code === 'not-found') {
      return { success: false, message: 'User not found or no longer exists.' };
    } else {
      return { success: false, message: 'Failed to block user. Please check your internet connection and try again.' };
    }
  }
};

// Unblock user with improved error handling and auth checks
export const unblockUser = async (currentUserId: string, targetUserId: string) => {
  // Check if user is authenticated
  if (!auth.currentUser) {
    console.error('No authenticated user found');
    return { success: false, message: 'You must be signed in to unblock users' };
  }

  // Ensure currentUserId matches authenticated user
  if (currentUserId !== auth.currentUser.uid) {
    console.error('Authentication mismatch:', {
      providedUserId: currentUserId,
      authenticatedUserId: auth.currentUser.uid
    });
    return { success: false, message: 'Authentication error. Please sign in again.' };
  }

  if (!currentUserId || !targetUserId) {
    console.error('Invalid user IDs provided');
    return { success: false, message: 'Invalid user information provided' };
  }
  
  try {
    console.log('Starting unblock user operation with authentication check:', {
      currentUserId,
      targetUserId,
      authenticatedUserId: auth.currentUser.uid,
      userEmail: auth.currentUser.email
    });
    
    // Check if user is actually blocked
    const blockedUserPath = `/users/${currentUserId}/blockedUsers/${targetUserId}`;
    console.log('Checking if user is blocked at path:', blockedUserPath);
    
    const blockedUserDoc = await getDoc(doc(db, 'users', currentUserId, 'blockedUsers', targetUserId));
    if (!blockedUserDoc.exists()) {
      console.log('User is not blocked');
      return { success: false, message: 'User is not blocked' };
    }

    const blockedUsersRef = doc(db, 'users', currentUserId, 'blockedUsers', targetUserId);
    console.log('Deleting blocked user document at path:', blockedUsersRef.path);
    
    await deleteDoc(blockedUsersRef);
    
    console.log('Unblock user operation completed successfully');
    return { success: true, message: 'User unblocked successfully' };
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Current user auth state:', {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isAuthenticated: !!auth.currentUser
    });
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      console.error('Permission denied - checking auth state and document path');
      return { success: false, message: 'Permission denied. Please make sure you are signed in and try again.' };
    } else if (error.code === 'unavailable') {
      return { success: false, message: 'Service temporarily unavailable. Please try again later.' };
    } else if (error.code === 'not-found') {
      return { success: false, message: 'User not found or no longer exists.' };
    } else {
      return { success: false, message: 'Failed to unblock user. Please check your internet connection and try again.' };
    }
  }
};

// Check if user is blocked
export const isUserBlocked = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const blockedUserDoc = await getDoc(doc(db, 'users', currentUserId, 'blockedUsers', targetUserId));
    return blockedUserDoc.exists();
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};

// Subscribe to follow request status
export const subscribeToFollowRequestStatus = (
  currentUserId: string,
  targetUserId: string,
  callback: (hasRequest: boolean) => void
) => {
  const followRequestsRef = collection(db, 'users', targetUserId, 'followRequests');
  const q = query(followRequestsRef, where('requesterId', '==', currentUserId));
  
  return onSnapshot(q, (snapshot) => {
    callback(!snapshot.empty);
  });
};

// Subscribe to blocked status
export const subscribeToBlockedStatus = (
  currentUserId: string,
  targetUserId: string,
  callback: (isBlocked: boolean) => void
) => {
  const blockedUserDoc = doc(db, 'users', currentUserId, 'blockedUsers', targetUserId);
  
  return onSnapshot(blockedUserDoc, (doc) => {
    callback(doc.exists());
  });
};
