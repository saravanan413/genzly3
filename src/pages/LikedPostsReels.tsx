
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LikedItem {
  id: string;
  postId: string;
  type: 'post' | 'reel';
  thumbnail: string;
  caption: string;
  likedAt: any;
}

const LikedPostsReels = () => {
  const { currentUser } = useAuth();
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    const likedQuery = query(collection(db, 'users', currentUser.uid, 'likedPosts'));
    
    const unsubscribe = onSnapshot(likedQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LikedItem[];
      
      setLikedItems(items.sort((a, b) => b.likedAt?.toDate() - a.likedAt?.toDate()));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching liked posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleUnlike = async (itemId: string, postId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'likedPosts', itemId));
      toast({
        title: "Success",
        description: "Removed from liked posts"
      });
    } catch (error) {
      console.error('Error unliking post:', error);
      toast({
        title: "Error",
        description: "Failed to remove from liked posts",
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
        <h1 className="text-xl font-semibold text-foreground">Liked Posts</h1>
      </div>
      
      <div className="p-4">
        {likedItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No liked posts yet</p>
            <p className="text-muted-foreground text-sm mt-2">Posts you like will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {likedItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border overflow-hidden">
                <div className="flex gap-3 p-3">
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm line-clamp-2 mb-2">
                      {item.caption || 'No caption'}
                    </p>
                    <p className="text-muted-foreground text-xs mb-3">
                      {item.type === 'post' ? 'Post' : 'Reel'} • Liked {item.likedAt?.toDate().toLocaleDateString()}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnlike(item.id, item.postId)}
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      Unlike
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedPostsReels;
