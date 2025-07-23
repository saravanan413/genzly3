
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { getFollowers, getFollowing, FollowData } from '../services/follow';
import { useAuth } from '../contexts/AuthContext';

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  userId?: string;
}

const FollowersFollowingModal: React.FC<FollowersFollowingModalProps> = ({
  isOpen,
  onClose,
  type,
  userId
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<FollowData[]>([]);
  const [loading, setLoading] = useState(false);

  const targetUserId = userId || currentUser?.uid;

  useEffect(() => {
    if (isOpen && targetUserId) {
      fetchUsers();
    }
  }, [isOpen, type, targetUserId]);

  const fetchUsers = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    
    try {
      let followData: FollowData[] = [];
      
      if (type === 'followers') {
        followData = await getFollowers(targetUserId);
      } else {
        followData = await getFollowing(targetUserId);
      }
      
      setUsers(followData);
    } catch (error) {
      setUsers([]);
    }
    setLoading(false);
  };

  const handleUserClick = (userId: string) => {
    onClose();
    if (userId === currentUser?.uid) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  // Generate default avatar
  const getFallbackAvatar = (): string => {
    return '/lovable-uploads/07e28f82-bd38-410c-a208-5db174616626.png';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-background rounded-2xl shadow-xl overflow-hidden animate-slide-in-bottom flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg capitalize">
            {type} ({users.length})
          </h2>
          <button onClick={onClose} className="hover:bg-muted p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading {type}...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y">
              {users.map((followData) => {
                const userInfo = type === 'followers' ? followData.followerInfo : followData.followedInfo;
                const userId = type === 'followers' ? followData.followerId : followData.followedId;
                const avatarUrl = userInfo.avatar || getFallbackAvatar();
                
                return (
                  <div 
                    key={userId} 
                    className="flex items-center px-4 py-3 gap-3 hover:bg-muted transition cursor-pointer"
                    onClick={() => handleUserClick(userId)}
                  >
                    <div className="w-11 h-11 rounded-full flex-shrink-0">
                      <img 
                        src={avatarUrl} 
                        alt={userInfo.username} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {userInfo.username || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {userInfo.displayName || userInfo.username || 'Unknown User'}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {followData.timestamp ? new Date(followData.timestamp.toDate()).toLocaleDateString() : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-sm">No {type} yet</p>
              <p className="text-xs mt-1">
                {type === 'followers' 
                  ? 'When people follow this account, they\'ll appear here.' 
                  : 'When this account follows people, they\'ll appear here.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersFollowingModal;
