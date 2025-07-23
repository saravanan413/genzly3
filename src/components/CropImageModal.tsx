
import React, { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CropImageModalProps {
  open: boolean;
  image: string;
  aspect?: number; // e.g. 1 for square, 4/5 for IG story
  onCancel: () => void;
  onCrop: (croppedImage: string) => void;
}

function getCroppedImg(imageSrc: string, crop: any, zoom: number, aspect = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;

      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context found");

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        crop.width,
        crop.height
      );
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = reject;
  });
}

const CropImageModal: React.FC<CropImageModalProps> = ({
  open,
  image,
  aspect = 1,
  onCancel,
  onCrop,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    const croppedUrl = await getCroppedImg(image, croppedAreaPixels, zoom, aspect);
    onCrop(croppedUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-[90vw] w-[350px] relative">
          <div className="relative w-full h-56 bg-muted">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex gap-3 mt-4 flex-row-reverse">
            <Button onClick={handleCrop} className="flex-1">Crop</Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
export default CropImageModal;
