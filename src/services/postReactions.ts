
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PostReaction {
  userId: string;
  username: string;
  timestamp: any;
}

export const likePost = async (postId: string, userId: string, username: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayUnion(userId),
      likeCount: increment(1),
      [`reactions.${userId}`]: {
        userId,
        username,
        type: 'like',
        timestamp: new Date()
      }
    });
    console.log('Post liked successfully');
    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayRemove(userId),
      likeCount: increment(-1),
      [`reactions.${userId}`]: null
    });
    console.log('Post unliked successfully');
    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

export const subscribeToPostReactions = (postId: string, callback: (likes: string[], likeCount: number) => void) => {
  const postRef = doc(db, 'posts', postId);
  
  return onSnapshot(postRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.likes || [], data.likeCount || 0);
    }
  });
};

export const checkIfLiked = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const likes = postDoc.data().likes || [];
      return likes.includes(userId);
    }
    return false;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};
