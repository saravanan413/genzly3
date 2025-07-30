
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Eye, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: any;
  expiresAt: any;
  viewers: string[];
  viewCount: number;
}

const MyStories = () => {
  const { currentUser } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    const storiesQuery = query(
      collection(db, 'stories'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      const userStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      
      setStories(userStories);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching user stories:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const posted = timestamp.toDate();
    const diffMs = now.getTime() - posted.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'stories', storyId));
      toast({
        title: "Success",
        description: "Story deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive"
      });
    }
  };

  const isStoryExpired = (expiresAt: any) => {
    if (!expiresAt) return false;
    return new Date() > expiresAt.toDate();
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
        <h1 className="text-xl font-semibold text-foreground">My Stories</h1>
      </div>
      
      <div className="p-4">
        {stories.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No stories yet</p>
            <p className="text-muted-foreground text-sm mt-2">Your stories will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <div key={story.id} className="bg-card rounded-lg border overflow-hidden">
                <div className="flex gap-3 p-4">
                  <div className="relative">
                    <img
                      src={story.mediaUrl}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    {story.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                          <div className="w-2 h-2 border-l-2 border-l-white ml-0.5"></div>
                        </div>
                      </div>
                    )}
                    {isStoryExpired(story.expiresAt) && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Expired</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        {formatTimeAgo(story.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground text-sm">
                        {story.viewCount || story.viewers?.length || 0} views
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteStory(story.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
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

export default MyStories;
