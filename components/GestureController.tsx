import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { AppMode, GestureControlProps } from '../types';

const GestureController: React.FC<GestureControlProps> = ({ onGesture, onMove, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  
  // Initialize MediaPipe
  useEffect(() => {
    if (!isActive) return;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      setLoaded(true);
      startCamera();
    };

    init();

    return () => {
       if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
       }
       cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const startCamera = async () => {
     try {
         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
         if (videoRef.current) {
             videoRef.current.srcObject = stream;
             videoRef.current.addEventListener("loadeddata", predictWebcam);
         }
     } catch (e) {
         console.error("Camera error:", e);
     }
  };

  const predictWebcam = () => {
      if (!landmarkerRef.current || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if(!ctx) return;

      // Ensure canvas matches video size
      if(canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
      }

      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Mirror effect
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      // Draw video frame for feedback
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const drawingUtils = new DrawingUtils(ctx);
          
          // Draw connectors
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
              color: "#FF69B4",
              lineWidth: 3
          });
          drawingUtils.drawLandmarks(landmarks, {
              color: "#FFF",
              radius: 3
          });

          // --- LOGIC ---
          // 1. Detect Pinch/Fist vs Open
          // Index tip (8) to Thumb tip (4)
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
          
          // Thresholds depend on coordinate space (0-1), usually ~0.05 is a pinch
          if (distance < 0.08) {
              onGesture(AppMode.TREE);
          } else if (distance > 0.15) {
               // Also check if fingers are spread? Simple distance is okay for now.
               onGesture(AppMode.EXPLODE);
          }

          // 2. Detect Movement (X-axis) for rotation
          // Use wrist (0) x position
          // x is 0-1. 0.5 is center.
          // Because we mirrored the canvas, x is flipped visually, but raw data is standard.
          // Moving hand left (screen right) -> Rotate one way
          // We map 0..1 to -1..1
          const rawX = landmarks[0].x;
          // Smooth slightly if needed, but pure React state update might be jumpy.
          // Better to pass raw delta.
          onMove((rawX - 0.5) * -2); // -1 to 1 range
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(predictWebcam);
  };

  if (!isActive) return null;

  return (
    <div className="absolute bottom-5 right-5 z-50 overflow-hidden rounded-2xl border-2 border-pink-500/50 shadow-[0_0_20px_rgba(255,105,180,0.5)]">
        {!loaded && <div className="p-4 text-white font-serif animate-pulse">Loading AI...</div>}
        <div className="relative w-48 h-36 bg-black">
            <video ref={videoRef} className="absolute opacity-0 w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-0 w-full bg-black/60 text-center text-[10px] text-pink-200 py-1 font-mono">
            Pinch: Tree | Open: Explode
        </div>
    </div>
  );
};

export default GestureController;
