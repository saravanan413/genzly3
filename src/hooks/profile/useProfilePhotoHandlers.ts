
import { useState, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';

export const useProfilePhotoHandlers = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [cropImageData, setCropImageData] = useState<string | null>(null);

  // Handle profile photo selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type, file.size);
    
    // Check file type - allow jpg, jpeg, png, webp
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WebP image file",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        console.log('File read successfully, opening crop modal');
        setCropImageData(event.target.result);
        setShowCrop(true);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast({
        title: "Error reading file",
        description: "Failed to read the selected image",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = async (croppedImage: string, onImageUpdate: (url: string) => void) => {
    if (!currentUser?.uid) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload a profile picture",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Starting profile picture upload for user:', currentUser.uid);
    setUploading(true);
    
    try {
      // Convert base64 to blob with better compression
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      console.log('Blob created, size:', blob.size, 'type:', blob.type);
      
      // Create a smaller blob if the file is too large
      let finalBlob = blob;
      if (blob.size > 1024 * 1024) { // If larger than 1MB, compress
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = croppedImage;
        });
        
        // Resize to max 400x400 for profile pictures
        const maxSize = 400;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        finalBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/jpeg', 0.8);
        });
        
        console.log('Compressed blob size:', finalBlob.size);
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${currentUser.uid}_${timestamp}.jpg`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profilePictures/${fileName}`);
      
      console.log('Uploading to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, finalBlob, {
        contentType: 'image/jpeg',
      });
      console.log('Upload successful');
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        avatar: downloadURL
      });
      
      console.log('Firestore updated successfully');
      
      // Update local state
      onImageUpdate(downloadURL);
      setShowCrop(false);
      setCropImageData(null);
      
      toast({
        title: "Success!",
        description: "Profile picture updated successfully"
      });
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      
      let errorMessage = "Failed to upload profile picture. Please try again.";
      
      if (error?.code === 'storage/retry-limit-exceeded') {
        errorMessage = "Upload failed due to connection issues. Please check your internet and try again.";
      } else if (error?.code === 'storage/unauthorized') {
        errorMessage = "You don't have permission to upload images. Please try logging in again.";
      } else if (error?.code === 'storage/quota-exceeded') {
        errorMessage = "Storage quota exceeded. Please contact support.";
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    console.log('Crop cancelled');
    setShowCrop(false);
    setCropImageData(null);
  };

  // Remove profile picture
  const handleRemovePhoto = async (onImageUpdate: (url: string) => void) => {
    if (!currentUser?.uid) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to remove your profile picture",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Removing profile picture for user:', currentUser.uid);
    setUploading(true);
    
    try {
      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        avatar: ''
      });
      
      console.log('Avatar field cleared in Firestore');
      
      // Update local state
      onImageUpdate('');
      
      toast({
        title: "Success!",
        description: "Profile picture removed successfully"
      });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    showCrop,
    cropImageData,
    handleFileChange,
    handleCropDone,
    handleCropCancel,
    handleRemovePhoto
  };
};
