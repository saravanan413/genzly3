
import { useState } from 'react';
import { useFeedPosts } from './useFirebaseData';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, increment, getDoc, setDoc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendLikeNotification } from '../services/notificationService';

export const useFeedData = () => {
  const { posts, loading, hasMore, refreshPosts, loadMorePosts } = useFeedPosts();
  const { currentUser, userProfile } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const handleLike = async (postId: string) => {
    if (!currentUser || !userProfile) return;

    const isLiked = likedPosts.has(postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      // Update local state immediately
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      // Update post likes count in Firestore
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(isLiked ? -1 : 1)
      });

      // Handle like/unlike in likes collection
      const likeRef = doc(db, 'posts', postId, 'likes', currentUser.uid);
      
      if (isLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          userId: currentUser.uid,
          username: userProfile.username,
          timestamp: serverTimestamp()
        });

        // Send like notification
        await sendLikeNotification(
          currentUser.uid,
          post.userId,
          userProfile.displayName || userProfile.username,
          postId
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
      // Revert local state on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser || !userProfile) return;

    const isFollowing = followedUsers.has(userId);

    try {
      // Update local state immediately
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      // Update follow relationships in Firestore
      const followerRef = doc(db, 'followers', userId, 'list', currentUser.uid);
      const followingRef = doc(db, 'following', currentUser.uid, 'list', userId);

      if (isFollowing) {
        // Unfollow
        await deleteDoc(followerRef);
        await deleteDoc(followingRef);
        
        // Update user stats
        await updateDoc(doc(db, 'users', userId), {
          followers: increment(-1)
        });
        await updateDoc(doc(db, 'users', currentUser.uid), {
          following: increment(-1)
        });
      } else {
        // Follow
        await setDoc(followerRef, {
          userId: currentUser.uid,
          username: userProfile.username,
          timestamp: serverTimestamp()
        });
        await setDoc(followingRef, {
          userId: userId,
          timestamp: serverTimestamp()
        });
        
        // Update user stats
        await updateDoc(doc(db, 'users', userId), {
          followers: increment(1)
        });
        await updateDoc(doc(db, 'users', currentUser.uid), {
          following: increment(1)
        });

        // Send follow notification
        const { sendFollowNotification } = await import('../services/notificationService');
        await sendFollowNotification(
          currentUser.uid,
          userId,
          userProfile.displayName || userProfile.username
        );
      }
    } catch (error) {
      console.error('Error handling follow:', error);
      // Revert local state on error
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    }
  };

  const handleDoubleClick = (postId: string) => {
    if (!likedPosts.has(postId)) {
      handleLike(postId);
    }
  };

  return {
    posts,
    loading,
    hasMore,
    loadMorePosts,
    handleRefresh: refreshPosts,
    handleLike,
    handleFollow,
    handleDoubleClick
  };
};
