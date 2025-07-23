
import { Camera, X } from 'lucide-react';
import { useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';

interface ProfilePhotoSectionProps {
  profileImage: string;
  displayAvatar: string;
  uploading: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}

const ProfilePhotoSection = ({ 
  profileImage, 
  displayAvatar, 
  uploading, 
  onFileChange, 
  onRemovePhoto 
}: ProfilePhotoSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoClick = () => {
    if (uploading) return;
    console.log('Profile photo clicked, opening file selector');
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files?.length);
    onFileChange(e);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative mb-3">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted">
          <img
            src={displayAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log('Image failed to load, using fallback');
              e.currentTarget.src = '/lovable-uploads/07e28f82-bd38-410c-a208-5db174616626.png';
            }}
          />
        </div>
        <button
          onClick={handleProfilePhotoClick}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background disabled:opacity-50 hover:bg-primary/90 transition-colors"
          aria-label="Change profile picture"
        >
          <Camera size={16} className="text-primary-foreground" />
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleProfilePhotoClick}
          disabled={uploading}
          className="text-primary font-medium text-sm disabled:opacity-50 hover:underline transition-colors"
        >
          {uploading ? 'Uploading...' : 'Change photo'}
        </button>
        
        {profileImage && !uploading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemovePhoto}
            className="text-destructive hover:text-destructive/80 text-xs"
          >
            <X size={12} className="mr-1" />
            Remove photo
          </Button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={uploading}
      />
    </div>
  );
};

export default ProfilePhotoSection;
