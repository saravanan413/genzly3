
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Shield, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BlockedUser {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  blockedAt: any;
}

const BlockedAccounts = () => {
  const { currentUser } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    const blockedQuery = query(collection(db, 'users', currentUser.uid, 'blockedUsers'));
    
    const unsubscribe = onSnapshot(blockedQuery, async (snapshot) => {
      const blockedUserIds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch user details for each blocked user
      const usersWithDetails = await Promise.all(
        blockedUserIds.map(async (blocked) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', blocked.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...blocked,
                username: userData.username || 'Unknown',
                displayName: userData.displayName || 'Unknown User',
                avatar: userData.avatar
              };
            }
            return blocked;
          } catch (error) {
            console.error('Error fetching user details:', error);
            return blocked;
          }
        })
      );
      
      setBlockedUsers(usersWithDetails.sort((a, b) => b.blockedAt?.toDate() - a.blockedAt?.toDate()));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching blocked users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleUnblock = async (blockedId: string, username: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'blockedUsers', blockedId));
      toast({
        title: "Success",
        description: `Unblocked @${username}`
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center gap-4 z-10">
        <button onClick={() => navigate('/settings')}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Blocked Accounts</h1>
      </div>
      
      <div className="p-4">
        {blockedUsers.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No blocked users</p>
            <p className="text-muted-foreground text-sm mt-2">Accounts you block will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((user) => (
              <div key={user.id} className="bg-card rounded-lg border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=eee&color=555&size=40`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-foreground font-medium">{user.displayName}</p>
                    <p className="text-muted-foreground text-sm">@{user.username}</p>
                    <p className="text-muted-foreground text-xs">
                      Blocked {user.blockedAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnblock(user.id, user.username)}
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedAccounts;
