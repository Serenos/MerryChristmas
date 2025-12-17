import React from 'react';
import { AppMode } from '../types';

interface OverlayProps {
  started: boolean;
  onEnter: (gesture: boolean) => void;
  mode: AppMode;
  toggleAudio: () => void;
  isMuted: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ started, onEnter, mode, toggleAudio, isMuted }) => {
  if (!started) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white transition-opacity duration-1000">
        <h1 className="text-6xl md:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-white drop-shadow-[0_0_15px_rgba(255,192,203,0.8)] mb-8 tracking-wider">
          DREAMY XMAS
        </h1>
        <div className="flex flex-col md:flex-row gap-6">
          <button 
            onClick={() => onEnter(false)}
            className="px-8 py-3 border border-pink-500/30 bg-pink-900/20 hover:bg-pink-500/40 transition-all rounded-full text-lg tracking-widest font-light"
          >
            ENTER EXPERIENCE
          </button>
          <button 
            onClick={() => onEnter(true)}
            className="px-8 py-3 border border-purple-500/30 bg-purple-900/20 hover:bg-purple-500/40 transition-all rounded-full text-lg tracking-widest font-light flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            GESTURE MODE
          </button>
        </div>
        <p className="mt-8 text-white/40 text-sm font-sans">Please enable sound for full immersion</p>
      </div>
    );
  }

  return (
    <>
        <div className="absolute top-8 left-8 z-40">
            <h2 className="text-2xl font-serif text-white/80 tracking-widest drop-shadow-md">
                {mode === AppMode.TREE ? 'TREE FORM' : 'CHAOS FORM'}
            </h2>
        </div>

        <button 
            onClick={toggleAudio}
            className="absolute top-8 right-8 z-40 w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-black/20 text-white/80 hover:bg-white/10 transition-colors"
        >
            {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
        </button>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 text-white/30 text-xs tracking-[0.2em] pointer-events-none">
            CLICK TO TOGGLE • {started ? 'ACTIVE' : 'READY'}
        </div>
    </>
  );
};

export default Overlay;
