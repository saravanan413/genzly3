import React, { useRef, useState, useEffect } from 'react';
import { Camera, Images, Zap, ZapOff, RotateCcw, Video, Image } from 'lucide-react';
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
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<{ front: boolean; back: boolean }>({
    front: false,
    back: false
  });
  const { toast } = useToast();

  useEffect(() => {
    checkCameraAvailability();
  }, []);

  useEffect(() => {
    if (permissionGranted) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraFacing, captureMode, permissionGranted]);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const cameras = {
        front: videoDevices.some(device => 
          device.label.toLowerCase().includes('front') || 
          device.label.toLowerCase().includes('user')
        ),
        back: videoDevices.some(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        )
      };

      if (videoDevices.length > 0 && !cameras.front && !cameras.back) {
        cameras.front = true;
        cameras.back = videoDevices.length > 1;
      }

      setAvailableCameras(cameras);
      
      if (cameras.back) {
        setCameraFacing('environment');
      } else if (cameras.front) {
        setCameraFacing('user');
      }

      await requestCameraPermission();
    } catch (error) {
      console.error('Error checking camera availability:', error);
      toast({
        title: "Camera Error",
        description: "Unable to check camera availability.",
        variant: "destructive"
      });
    }
  };

  const requestCameraPermission = async () => {
    try {
      const constraints = {
        video: {
          facingMode: cameraFacing === 'user' ? 'user' : { exact: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: captureMode === 'video'
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setPermissionGranted(true);
      
      mediaStream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Permission denied or camera not available:', error);
      setPermissionGranted(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Camera Permission Required",
            description: "Camera access is required to switch cameras. Please enable it in settings.",
            variant: "destructive"
          });
        } else if (error.name === 'NotFoundError') {
          toast({
            title: "Camera Not Found",
            description: `${cameraFacing === 'user' ? 'Front' : 'Back'} camera not available on this device.`,
            variant: "destructive"
          });
        }
      }
      
      return false;
    }
  };

  const startCamera = async () => {
    if (!permissionGranted) return;

    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: cameraFacing === 'user' ? 'user' : { exact: 'environment' },
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
      console.error('Error starting camera:', error);
      
      if (error instanceof DOMException && error.name === 'OverconstrainedError') {
        try {
          const fallbackConstraints = {
            video: {
              facingMode: cameraFacing,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: captureMode === 'video'
          };

          const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          setStream(fallbackStream);
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
        } catch (fallbackError) {
          console.error('Fallback camera start failed:', fallbackError);
          toast({
            title: "Camera Error",
            description: `${cameraFacing === 'user' ? 'Front' : 'Back'} camera not available on this device.`,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const switchCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    
    const targetAvailable = newFacing === 'user' ? availableCameras.front : availableCameras.back;
    
    if (!targetAvailable) {
      toast({
        title: "Camera Not Available",
        description: `${newFacing === 'user' ? 'Front' : 'Back'} camera not available on this device.`,
        variant: "destructive"
      });
      return;
    }

    setCameraFacing(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // For front camera, we need to flip the canvas to get the unmirrored image
    if (cameraFacing === 'user') {
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
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

  const toggleCaptureMode = () => {
    setCaptureMode(captureMode === 'photo' ? 'video' : 'photo');
  };

  if (!permissionGranted) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white p-6">
          <Camera size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Camera Access Required</h2>
          <p className="text-gray-300 mb-4">Please allow camera access to continue</p>
          <Button 
            onClick={requestCameraPermission}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Enable Camera
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera Preview */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            cameraFacing === 'user' ? 'scale-x-[-1]' : ''
          }`}
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
              <Images size={24} />
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
              disabled={!availableCameras.front || !availableCameras.back}
              className="w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50 disabled:opacity-50"
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
