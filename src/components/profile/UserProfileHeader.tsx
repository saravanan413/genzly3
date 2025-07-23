
import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Share, Shield, ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '../../services/firestoreService';
import { blockUser, unblockUser } from '../../services/privacy/privacyService';
import { useAuth } from '../../contexts/AuthContext';
import ReportModal from '../ReportModal';

interface UserProfileHeaderProps {
  user: UserProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  hasFollowRequest?: boolean;
  isBlocked?: boolean;
  loading: boolean;
  followCounts: { followers: number; following: number };
  userPostsLength: number;
  onFollowClick: () => void;
  onMessageClick: () => void;
  onShareClick: () => void;
  onConnectionsClick: (tab: "followers" | "following") => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  isOwnProfile,
  isFollowing,
  hasFollowRequest = false,
  isBlocked = false,
  loading,
  followCounts,
  userPostsLength,
  onFollowClick,
  onMessageClick,
  onShareClick,
  onConnectionsClick
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [blockLoading, setBlockLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleBlockUser = async () => {
    if (!currentUser || !user?.id || blockLoading) {
      console.log('Block operation aborted - missing requirements');
      return;
    }
    
    setBlockLoading(true);
    console.log('Starting block/unblock operation for user:', user.id);
    
    try {
      let result;
      if (isBlocked) {
        console.log('Attempting to unblock user...');
        result = await unblockUser(currentUser.uid, user.id);
      } else {
        console.log('Attempting to block user...');
        result = await blockUser(currentUser.uid, user.id);
      }
      
      console.log('Block/unblock result:', result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          duration: 3000
        });
      } else {
        toast({
          title: "Error", 
          description: result.message,
          variant: "destructive",
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('Unexpected error in block/unblock operation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setBlockLoading(false);
    }
  };

  // Generate default avatar
  const getFallbackAvatar = () => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.username || 'User')}&background=ccc&color=333`;
  };

  const avatarUrl = user?.avatar || getFallbackAvatar();

  // Determine follow button state
  const getFollowButtonText = () => {
    if (loading) return 'Loading...';
    if (isFollowing) return 'Following';
    if (hasFollowRequest) return 'Requested';
    return 'Follow';
  };

  const getFollowButtonVariant = () => {
    if (isFollowing || hasFollowRequest) return 'outline';
    return 'default';
  };

  return (
    <>
      <div className="flex flex-col items-center text-center px-4 py-6">
        {/* Back Button - Top Left */}
        <div className="w-full flex justify-start mb-4">
          <Link 
            to="/explore" 
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm md:text-base">Back</span>
          </Link>
          
          {/* Share and Report Buttons - Top Right */}
          <div className="ml-auto flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={onShareClick}
              aria-label="Share Profile"
            >
              <Share size={16} className="md:w-5 md:h-5" />
            </Button>
            {!isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={() => setShowReportModal(true)}
                aria-label="Report User"
              >
                <Shield size={16} className="md:w-5 md:h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Profile Picture */}
        <div className="mb-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary/20 p-1">
            <img
              src={avatarUrl}
              alt={user?.displayName || user?.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Username */}
        <h1 className="text-xl md:text-2xl font-semibold mb-4">@{user?.username}</h1>

        {/* Follow, Message, and Block Buttons */}
        {!isOwnProfile && (
          <div className="flex space-x-3 mb-6">
            <Button 
              variant={getFollowButtonVariant()} 
              className="px-8 py-2 rounded-full"
              onClick={onFollowClick}
              disabled={loading || isBlocked}
            >
              {getFollowButtonText()}
            </Button>
            <Button 
              variant="outline" 
              className="px-6 py-2 rounded-full"
              onClick={onMessageClick}
              disabled={isBlocked}
            >
              <MessageCircle size={16} className="mr-2" />
              Message
            </Button>
            <Button 
              variant="outline" 
              className="px-4 py-2 rounded-full"
              onClick={handleBlockUser}
              disabled={blockLoading}
            >
              {blockLoading ? (
                <span className="animate-spin">⏳</span>
              ) : isBlocked ? (
                <>
                  <ShieldOff size={16} className="mr-2" />
                  Unblock
                </>
              ) : (
                <>
                  <Shield size={16} className="mr-2" />
                  Block
                </>
              )}
            </Button>
          </div>
        )}

        {/* Show blocked message if user is blocked */}
        {isBlocked && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have blocked this user. They cannot see your profile or send you messages.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-center space-x-12 mb-6">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{userPostsLength}</div>
            <div className="text-sm md:text-base text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div
              className="text-xl md:text-2xl font-bold cursor-pointer hover:underline text-primary"
              onClick={() => onConnectionsClick("followers")}
            >
              {followCounts.followers}
            </div>
            <div className="text-sm md:text-base text-muted-foreground cursor-pointer" onClick={() => onConnectionsClick("followers")}>
              Followers
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-xl md:text-2xl font-bold cursor-pointer hover:underline text-primary"
              onClick={() => onConnectionsClick("following")}
            >
              {followCounts.following}
            </div>
            <div className="text-sm md:text-base text-muted-foreground cursor-pointer" onClick={() => onConnectionsClick("following")}>
              Following
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="max-w-xs md:max-w-sm">
          <h2 className="font-semibold text-lg mb-2">{user.displayName || user.username}</h2>
          {user.bio ? (
            <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line mb-2">
              {user.bio}
            </p>
          ) : (
            <p className="text-sm md:text-base text-muted-foreground mb-2">
              No bio yet
            </p>
          )}
          {user.externalLink && (
            <a 
              href={user.externalLink.startsWith('http') ? user.externalLink : `https://${user.externalLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm md:text-base text-primary hover:underline"
            >
              {user.externalLink}
            </a>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="user"
        targetUserId={user?.id}
        targetUsername={user?.username}
      />
    </>
  );
};

export default UserProfileHeader;
