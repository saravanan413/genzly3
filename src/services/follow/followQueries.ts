import { 
  doc, 
  collection, 
  onSnapshot,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FollowData } from './types';

// Real-time follow status subscription - listens to /users/{targetUserId}/followers/{currentUserId}
export const subscribeToFollowStatus = (
  currentUserId: string, 
  targetUserId: string, 
  callback: (isFollowing: boolean) => void
) => {
  console.log('Subscribing to follow status:', { currentUserId, targetUserId });
  const followDocRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  
  return onSnapshot(followDocRef, (doc) => {
    const isFollowing = doc.exists();
    console.log('Follow status updated in real-time:', isFollowing);
    callback(isFollowing);
  }, (error) => {
    console.error('Error in follow status subscription:', error);
    callback(false);
  });
};

// Real-time followers count subscription - counts documents in /users/{userId}/followers
export const subscribeToFollowersCount = (userId: string, callback: (count: number) => void) => {
  console.log('Subscribing to followers count for user:', userId);
  const followersRef = collection(db, 'users', userId, 'followers');
  
  return onSnapshot(followersRef, (snapshot) => {
    const count = snapshot.size;
    console.log('Followers count updated in real-time:', count);
    callback(count);
  }, (error) => {
    console.error('Error in followers count subscription:', error);
    callback(0);
  });
};

// Real-time following count subscription - counts documents in /users/{userId}/following
export const subscribeToFollowingCount = (userId: string, callback: (count: number) => void) => {
  console.log('Subscribing to following count for user:', userId);
  const followingRef = collection(db, 'users', userId, 'following');
  
  return onSnapshot(followingRef, (snapshot) => {
    const count = snapshot.size;
    console.log('Following count updated in real-time:', count);
    callback(count);
  }, (error) => {
    console.error('Error in following count subscription:', error);
    callback(0);
  });
};

// Get followers list
export const getFollowers = async (userId: string): Promise<FollowData[]> => {
  console.log('Fetching followers for user:', userId);
  try {
    const followersRef = collection(db, 'users', userId, 'followers');
    const followersQuery = query(followersRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(followersQuery);
    
    const followers: FollowData[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      followers.push({
        followerId: doc.id,
        followedId: userId,
        followerInfo: {
          uid: data.uid,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar
        },
        followedInfo: {
          uid: userId,
          username: '',
          displayName: '',
          avatar: ''
        },
        timestamp: data.timestamp
      });
    });
    
    console.log('Fetched followers:', followers);
    return followers;
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
};

// Get following list
export const getFollowing = async (userId: string): Promise<FollowData[]> => {
  console.log('Fetching following for user:', userId);
  try {
    const followingRef = collection(db, 'users', userId, 'following');
    const followingQuery = query(followingRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(followingQuery);
    
    const following: FollowData[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      following.push({
        followerId: userId,
        followedId: doc.id,
        followerInfo: {
          uid: userId,
          username: '',
          displayName: '',
          avatar: ''
        },
        followedInfo: {
          uid: data.uid,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar
        },
        timestamp: data.timestamp
      });
    });
    
    console.log('Fetched following:', following);
    return following;
  } catch (error) {
    console.error('Error fetching following:', error);
    return [];
  }
};
