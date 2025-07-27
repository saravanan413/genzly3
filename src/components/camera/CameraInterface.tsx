
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Gallery, Zap, ZapOff, RotateCcw, Video, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CameraInterfaceProps {
  onMediaCaptured: (media: { type: 'image' | 'video', data: string, file: File }) => void;
  onGallerySelect: () => void;
}

const CameraInterface: React.FC<CameraInterfaceProps> = ({ onMediaCaptured, onGallerySelect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraFacing]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: captureMode === 'video'
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onMediaCaptured({ type: 'image', data: dataUrl, file });
      }
    }, 'image/jpeg', 0.8);
  };

  const startVideoRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    const chunks: Blob[] = [];
    setRecordedChunks(chunks);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const file = new File([blob], 'captured-video.mp4', { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      onMediaCaptured({ type: 'video', data: url, file });
      setRecordedChunks([]);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCapture = () => {
    if (captureMode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        }).catch(() => {
          toast({
            title: "Flash not supported",
            description: "Flash is not available on this device",
            variant: "destructive"
          });
        });
      }
    }
  };

  const switchCamera = () => {
    setCameraFacing(cameraFacing === 'user' ? 'environment' : 'user');
  };

  const toggleCaptureMode = () => {
    setCaptureMode(captureMode === 'photo' ? 'video' : 'photo');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera Preview */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            REC
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-4">
          <div className="flex bg-black/50 rounded-full p-1">
            <button
              onClick={toggleCaptureMode}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                captureMode === 'photo' 
                  ? 'bg-white text-black' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Image size={16} className="inline mr-2" />
              PHOTO
            </button>
            <button
              onClick={toggleCaptureMode}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                captureMode === 'video' 
                  ? 'bg-white text-black' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Video size={16} className="inline mr-2" />
              VIDEO
            </button>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onGallerySelect}
              className="w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50"
            >
              <Gallery size={24} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFlash}
              className="w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50"
            >
              {flashEnabled ? <Zap size={24} /> : <ZapOff size={24} />}
            </Button>
          </div>

          {/* Center capture button */}
          <Button
            onClick={handleCapture}
            className={`w-20 h-20 rounded-full border-4 border-white ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${
              isRecording ? 'bg-white' : 'bg-black'
            }`} />
          </Button>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50"
            >
              <RotateCcw size={24} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraInterface;
