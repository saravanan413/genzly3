
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { uploadPostMedia, createPost } from '../services/mediaService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Crop, Filter } from 'lucide-react';
import CropImageModal from "@/components/CropImageModal";
import Layout from '../components/Layout';
import { logger } from '../utils/logger';

const CreatePost = () => {
  const [selectedFile, setSelectedFile] = useState<{type: 'image' | 'video', data: string, file: File} | null>(null);
  const [caption, setCaption] = useState('');
  const [showEditOptions, setShowEditOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [showCrop, setShowCrop] = useState(false);
  const [cropImageData, setCropImageData] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : null;
    if (!fileType) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (fileType === 'image') {
        setCropImageData(reader.result as string);
        setShowCrop(true);
      } else {
        setSelectedFile({
          type: fileType,
          data: reader.result as string,
          file,
        });
        setShowEditOptions(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditImage = () => {
    if (selectedFile && selectedFile.type === 'image') {
      setCropImageData(selectedFile.data);
      setShowCrop(true);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setShowEditOptions(false);
    setCaption('');
  };

  const handlePublish = async () => {
    if (!selectedFile || !currentUser) return;
    
    setLoading(true);
    
    try {
      // Upload media to Firebase Storage
      const mediaURL = await uploadPostMedia(selectedFile.file, currentUser.uid);
      
      // Create post in Firestore
      await createPost(
        currentUser.uid,
        caption,
        mediaURL,
        selectedFile.type
      );
      
      toast({
        title: "Success!",
        description: `${selectedFile.type === 'image' ? 'Post' : 'Reel'} created successfully!`
      });
      
      navigate('/');
    } catch (error) {
      logger.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCropDone = (croppedImage: string) => {
    // Convert base64 to File object
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          setSelectedFile({ type: 'image', data: croppedImage, file });
        }
      });
    };
    img.src = croppedImage;
    
    setCropImageData(null);
    setShowCrop(false);
    setShowEditOptions(true);
  };
  
  const handleCropCancel = () => {
    setCropImageData(null);
    setShowCrop(false);
    if (!selectedFile) {
      setShowEditOptions(false);
    }
  };

  if (!currentUser) {
    return <div>Please log in to create posts</div>;
  }

  return (
    <Layout>
      {/* Crop Modal */}
      {cropImageData && (
        <CropImageModal
          open={showCrop}
          image={cropImageData}
          aspect={1}
          onCancel={handleCropCancel}
          onCrop={handleCropDone}
        />
      )}
      
      <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gray-900 px-4">
        <div className="bg-card dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-lg font-semibold mb-4 text-foreground dark:text-white">
            Create a new {selectedFile ? selectedFile.type === 'image' ? 'Post' : 'Reel' : 'Post/Reel'}
          </h2>
          
          <div className="mb-4">
            {selectedFile ? (
              <div className="relative">
                {selectedFile.type === 'image' ? (
                  <img src={selectedFile.data} alt="Preview" className="w-full rounded-lg" />
                ) : (
                  <video src={selectedFile.data} controls className="w-full rounded-lg" />
                )}
                
                {showEditOptions && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex space-x-3">
                      {selectedFile.type === 'image' && (
                        <button
                          onClick={handleEditImage}
                          className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                          title="Edit Image"
                        >
                          <Crop size={20} className="text-white" />
                        </button>
                      )}
                      <button
                        onClick={handleRemoveFile}
                        className="p-3 bg-red-500/70 rounded-full hover:bg-red-500/90 transition-colors"
                        title="Remove File"
                      >
                        <Trash2 size={20} className="text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center bg-muted dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <span className="text-muted-foreground dark:text-gray-400">No file selected</span>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click Gallery to choose a photo or video</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Button 
              type="button" 
              onClick={handleGalleryClick} 
              className="flex-1"
              variant={selectedFile ? "outline" : "default"}
              disabled={loading}
            >
              {selectedFile ? 'Change File' : 'Choose from Gallery'}
            </Button>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={`Write a caption for your ${selectedFile?.type || 'content'}...`}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-4 bg-background dark:bg-gray-700 text-foreground dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            maxLength={280}
            disabled={loading}
          />
          
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-4">
            {caption.length}/280 characters
          </div>
          
          <Button
            onClick={handlePublish}
            disabled={!selectedFile || loading}
            className="w-full"
          >
            {loading ? 'Publishing...' : `Share ${selectedFile?.type === 'image' ? 'Post' : selectedFile?.type === 'video' ? 'Reel' : 'Content'}`}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePost;
