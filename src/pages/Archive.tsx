
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Archive as ArchiveIcon, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ArchivedItem {
  id: string;
  type: 'post' | 'reel';
  mediaURL: string;
  caption: string;
  archivedAt: any;
  originalData: any;
}

const Archive = () => {
  const { currentUser } = useAuth();
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    const archiveQuery = query(collection(db, 'users', currentUser.uid, 'archived'));
    
    const unsubscribe = onSnapshot(archiveQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ArchivedItem[];
      
      setArchivedItems(items.sort((a, b) => b.archivedAt?.toDate() - a.archivedAt?.toDate()));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching archived items:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleRestore = async (item: ArchivedItem) => {
    if (!currentUser) return;

    try {
      // Add back to main collection
      const targetCollection = item.type === 'post' ? 'posts' : 'reels';
      await addDoc(collection(db, targetCollection), {
        ...item.originalData,
        userId: currentUser.uid
      });

      // Remove from archive
      await deleteDoc(doc(db, 'users', currentUser.uid, 'archived', item.id));

      toast({
        title: "Success",
        description: `${item.type} restored successfully`
      });
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: "Error",
        description: "Failed to restore item",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (itemId: string, type: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'archived', itemId));
      toast({
        title: "Success",
        description: `${type} deleted permanently`
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
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
        <h1 className="text-xl font-semibold text-foreground">Archive</h1>
      </div>
      
      <div className="p-4">
        {archivedItems.length === 0 ? (
          <div className="text-center py-16">
            <ArchiveIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No archived content</p>
            <p className="text-muted-foreground text-sm mt-2">Posts you archive will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {archivedItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={item.mediaURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRestore(item)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id, item.type)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-foreground text-xs line-clamp-2 mb-2">
                    {item.caption || 'No caption'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Archived {item.archivedAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
