import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, SpotLight } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import DreamTree from './components/DreamTree';
import Overlay from './components/Overlay';
import GestureController from './components/GestureController';
import { AppMode } from './types';
import { COLORS } from './constants';

const AudioPlayer = ({ isMuted, play }: { isMuted: boolean, play: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if(play && audioRef.current) {
            audioRef.current.play().catch(() => console.log("Autoplay blocked"));
        }
    }, [play]);

    useEffect(() => {
        if(audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    return (
        <audio 
            ref={audioRef} 
            loop 
            src="https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=christmas-magic-126456.mp3" 
            style={{ display: 'none' }} 
        />
    );
}

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [gestureMode, setGestureMode] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.TREE);
  const [isMuted, setIsMuted] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);

  const handleEnter = (enableGesture: boolean) => {
    setStarted(true);
    setGestureMode(enableGesture);
    setIsMuted(false);
  };

  const handleToggleMode = () => {
    setMode(prev => prev === AppMode.TREE ? AppMode.EXPLODE : AppMode.TREE);
  };

  const handleGesture = (detectedMode: AppMode) => {
    setMode(detectedMode);
  };

  const handleGestureMove = (x: number) => {
      // x is -1 to 1. 
      setRotationOffset(x);
  };

  return (
    <>
      <Overlay 
        started={started} 
        onEnter={handleEnter} 
        mode={mode} 
        toggleAudio={() => setIsMuted(!isMuted)} 
        isMuted={isMuted}
      />

      <AudioPlayer isMuted={isMuted} play={started} />

      {started && gestureMode && (
          <GestureController 
            isActive={gestureMode} 
            onGesture={handleGesture} 
            onMove={handleGestureMove} 
          />
      )}

      <div 
        className="w-full h-screen cursor-pointer" 
        onClick={handleToggleMode}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 12], fov: 45 }}
          gl={{ toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
        >
          <color attach="background" args={[COLORS.bg]} />
          
          <Suspense fallback={null}>
             {/* Scene Content */}
             <DreamTree appState={{ mode, rotationOffset }} />
             
             {/* Lighting */}
             <Environment preset="city" />
             <ambientLight intensity={0.5} color={COLORS.leaf2} />
             
             {/* Pink Rim Light */}
             <SpotLight 
                position={[10, 10, 10]} 
                angle={0.5} 
                penumbra={1} 
                intensity={100} 
                color="#ff0080" 
                castShadow 
             />
             <SpotLight 
                position={[-10, 0, -5]} 
                angle={0.5} 
                penumbra={1} 
                intensity={200} 
                color="cyan" 
             />
             {/* Bottom fill */}
             <pointLight position={[0, -5, 0]} intensity={5} color={COLORS.leaf1} />

             {/* Shadows */}
             <ContactShadows 
                position={[0, -6, 0]} 
                opacity={0.7} 
                scale={20} 
                blur={2.5} 
                far={4.5} 
                color={COLORS.leaf2} 
             />

             {/* Post Processing */}
             <EffectComposer disableNormalPass>
               <Bloom 
                luminanceThreshold={0.2} 
                mipmapBlur 
                intensity={1.2} 
                radius={0.6}
               />
               <Vignette eskil={false} offset={0.1} darkness={1.1} />
             </EffectComposer>

          </Suspense>
        </Canvas>
      </div>
    </>
  );
};

export default App;
