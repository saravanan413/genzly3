
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { DogFilter } from './DogFilter';

interface FilterManagerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  activeFilter: string;
  onFilterReady: (isReady: boolean) => void;
}

export const FilterManager: React.FC<FilterManagerProps> = ({
  videoRef,
  activeFilter,
  onFilterReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<facemesh.FaceMesh | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    initializeModel();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (model && videoRef.current) {
      startDetection();
    }
  }, [model, activeFilter]);

  const initializeModel = async () => {
    try {
      await tf.ready();
      const faceMeshModel = await facemesh.load();
      setModel(faceMeshModel);
      onFilterReady(true);
    } catch (error) {
      console.error('Error loading face detection model:', error);
      onFilterReady(false);
    }
  };

  const startDetection = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const detect = async () => {
      if (video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const predictions = await model.estimateFaces(video);
        setPredictions(predictions);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (predictions.length > 0 && activeFilter !== 'normal') {
          // Draw filter based on active filter
          renderFilter(ctx, predictions[0], canvas.width, canvas.height);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const renderFilter = (
    ctx: CanvasRenderingContext2D,
    face: any,
    width: number,
    height: number
  ) => {
    switch (activeFilter) {
      case 'dog':
        renderDogFilter(ctx, face, width, height);
        break;
      default:
        break;
    }
  };

  const renderDogFilter = (
    ctx: CanvasRenderingContext2D,
    face: any,
    width: number,
    height: number
  ) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    
    // Get key facial landmarks
    const noseTip = keypoints[1]; // Nose tip
    const leftEye = keypoints[33]; // Left eye
    const rightEye = keypoints[263]; // Right eye
    const forehead = keypoints[9]; // Forehead center
    
    // Calculate face dimensions
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0] - leftEye[0], 2) + 
      Math.pow(rightEye[1] - leftEye[1], 2)
    );
    
    const faceWidth = eyeDistance * 2.5;
    const faceHeight = faceWidth * 0.8;

    // Draw dog ears
    drawDogEars(ctx, leftEye, rightEye, forehead, faceWidth);
    
    // Draw dog nose
    drawDogNose(ctx, noseTip, faceWidth * 0.15);
    
    // Draw dog tongue (optional animation)
    drawDogTongue(ctx, noseTip, faceWidth * 0.1);
  };

  const drawDogEars = (
    ctx: CanvasRenderingContext2D,
    leftEye: number[],
    rightEye: number[],
    forehead: number[],
    faceWidth: number
  ) => {
    const earSize = faceWidth * 0.4;
    const earOffset = faceWidth * 0.6;

    // Left ear
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(
      leftEye[0] - earOffset,
      forehead[1] - earSize * 0.3,
      earSize * 0.6,
      earSize,
      -Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.ellipse(
      rightEye[0] + earOffset,
      forehead[1] - earSize * 0.3,
      earSize * 0.6,
      earSize,
      Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Inner ear (pink)
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.ellipse(
      leftEye[0] - earOffset,
      forehead[1] - earSize * 0.2,
      earSize * 0.3,
      earSize * 0.6,
      -Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(
      rightEye[0] + earOffset,
      forehead[1] - earSize * 0.2,
      earSize * 0.3,
      earSize * 0.6,
      Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();
  };

  const drawDogNose = (
    ctx: CanvasRenderingContext2D,
    noseTip: number[],
    size: number
  ) => {
    // Draw black nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(noseTip[0], noseTip[1], size, size * 0.7, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Add shine effect
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(
      noseTip[0] - size * 0.3,
      noseTip[1] - size * 0.3,
      size * 0.3,
      size * 0.2,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();
  };

  const drawDogTongue = (
    ctx: CanvasRenderingContext2D,
    noseTip: number[],
    size: number
  ) => {
    // Animate tongue with simple bob
    const time = Date.now() * 0.003;
    const tongueY = noseTip[1] + size * 2 + Math.sin(time) * 5;

    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.ellipse(
      noseTip[0],
      tongueY,
      size * 0.8,
      size * 1.5,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Tongue outline
    ctx.strokeStyle = '#FF1493';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  if (activeFilter === 'normal') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      style={{
        transform: videoRef.current?.style.transform || ''
      }}
    />
  );
};
