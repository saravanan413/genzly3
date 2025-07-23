
import { useState } from 'react';
import { useReels } from './useFirebaseData';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, increment, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendLikeNotification, sendFollowNotification } from '../services/notificationService';

export const useReelsActions = () => {
  const { reels: firebaseReels, loading, hasMore, loadMoreReels } = useReels();
  const { currentUser, userProfile } = useAuth();
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const handleLike = async (id: string) => {
    if (!currentUser || !userProfile) return;

    const isLiked = likedReels.has(id);
    const reel = firebaseReels.find(r => r.id === id);
    if (!reel) return;

    try {
      setLikedReels(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });

      // Update reel likes count
      await updateDoc(doc(db, 'reels', id), {
        likes: increment(isLiked ? -1 : 1)
      });

      // Handle like/unlike in likes collection
      const likeRef = doc(db, 'reels', id, 'likes', currentUser.uid);
      
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
          reel.userId,
          userProfile.displayName || userProfile.username,
          id
        );
      }
    } catch (error) {
      console.error('Error handling reel like:', error);
    }
  };

  const handleSave = async (id: string) => {
    if (!currentUser) return;

    const isSaved = savedReels.has(id);

    try {
      setSavedReels(prev => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });

      const saveRef = doc(db, 'users', currentUser.uid, 'saved', id);
      
      if (isSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, {
          type: 'reel',
          reelId: id,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error handling reel save:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser || !userProfile) return;

    const isFollowing = followedUsers.has(userId);

    try {
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      const followerRef = doc(db, 'followers', userId, 'list', currentUser.uid);
      const followingRef = doc(db, 'following', currentUser.uid, 'list', userId);

      if (isFollowing) {
        await deleteDoc(followerRef);
        await deleteDoc(followingRef);
        
        await updateDoc(doc(db, 'users', userId), {
          followers: increment(-1)
        });
        await updateDoc(doc(db, 'users', currentUser.uid), {
          following: increment(1)
        });
      } else {
        await setDoc(followerRef, {
          userId: currentUser.uid,
          username: userProfile.username,
          timestamp: serverTimestamp()
        });
        await setDoc(followingRef, {
          userId: userId,
          timestamp: serverTimestamp()
        });
        
        await updateDoc(doc(db, 'users', userId), {
          followers: increment(1)
        });
        await updateDoc(doc(db, 'users', currentUser.uid), {
          following: increment(1)
        });

        await sendFollowNotification(
          currentUser.uid,
          userId,
          userProfile.displayName || userProfile.username
        );
      }
    } catch (error) {
      console.error('Error handling follow:', error);
    }
  };

  // Transform Firebase reels to match expected format
  const reels = firebaseReels.map(reel => ({
    id: parseInt(reel.id, 10) || 0,
    videoUrl: reel.videoURL,
    videoThumbnail: reel.thumbnailURL || reel.videoURL,
    user: {
      name: reel.user.username,
      avatar: reel.user.avatar || '/placeholder.svg',
      isFollowing: followedUsers.has(reel.userId)
    },
    caption: reel.caption,
    music: reel.music || `Original Audio - ${reel.user.username}`,
    likes: reel.likes + (likedReels.has(reel.id) ? 1 : 0),
    comments: reel.comments,
    shares: reel.shares,
    isLiked: likedReels.has(reel.id),
    isSaved: savedReels.has(reel.id)
  }));

  return {
    reels,
    loading,
    hasMore,
    loadMoreReels,
    handleLike,
    handleSave,
    handleFollow
  };
};
