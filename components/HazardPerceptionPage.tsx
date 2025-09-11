import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from './icons';
import { MOCK_HAZARD_CLIPS, MAX_SCORE_PER_CLIP } from '../constants';

interface HazardPerceptionPageProps {
  navigateTo: (page: Page) => void;
  onTestComplete: (scores: number[]) => void;
}

const HazardPerceptionPage: React.FC<HazardPerceptionPageProps> = ({ navigateTo, onTestComplete }) => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [clipState, setClipState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [progress, setProgress] = useState(0);
  const [clicks, setClicks] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const currentClip = MOCK_HAZARD_CLIPS[currentClipIndex];

  const animate = (time: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = time;
    }
    const elapsed = time - startTimeRef.current;
    const newProgress = Math.min((elapsed / currentClip.duration) * 100, 100);
    setProgress(newProgress);

    if (newProgress < 100) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      finishClip();
    }
  };

  const startClip = () => {
    setClipState('playing');
    startTimeRef.current = null;
    setProgress(0);
    setClicks([]);
    setFeedback(null);
    requestRef.current = requestAnimationFrame(animate);
  };
  
  const finishClip = useCallback(() => {
    setClipState('finished');
    if(requestRef.current) cancelAnimationFrame(requestRef.current);

    const score = calculateScore();
    const newScores = [...scores, score];
    setScores(newScores);
    setFeedback(`Clip score: ${score}`);

    setTimeout(() => {
      const nextClipIndex = currentClipIndex + 1;
      if (nextClipIndex < MOCK_HAZARD_CLIPS.length) {
        setCurrentClipIndex(nextClipIndex);
        setClipState('ready');
        setProgress(0);
      } else {
        onTestComplete(newScores);
      }
    }, 2000);
  }, [clicks, currentClip, scores, currentClipIndex, onTestComplete]);
  
  useEffect(() => {
    return () => {
      if(requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, []);

  const calculateScore = () => {
    if (clicks.length === 0 || clicks.length > 2) return 0;

    const clickProgress = clicks[0];
    const { hazardWindowStart, hazardWindowEnd } = currentClip;

    if (clickProgress >= hazardWindowStart && clickProgress <= hazardWindowEnd) {
      const windowSize = hazardWindowEnd - hazardWindowStart;
      const positionInWindow = (clickProgress - hazardWindowStart) / windowSize;
      const score = Math.max(1, Math.floor(MAX_SCORE_PER_CLIP * (1 - positionInWindow)));
      return score;
    }
    return 0;
  };

  const handlePlayerClick = () => {
    if (clipState !== 'playing') return;
    setClicks(prev => [...prev, progress]);
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="text-lg font-bold text-gray-900 dark:text-white">Hazard Perception</p>
        <p className="text-gray-500 dark:text-gray-400 text-right mt-2">Clip {currentClipIndex + 1} of {MOCK_HAZARD_CLIPS.length}</p>
      </header>
      
      <main>
        <div 
          className="relative w-full aspect-video bg-gray-200 dark:bg-slate-900 rounded-lg border-2 border-gray-300 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: clipState !== 'ready' ? `url(${currentClip.backgroundUrl})` : undefined }}
          onClick={handlePlayerClick}
        >
          {clipState === 'ready' && (
            <div className="text-center p-4">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Clip {currentClipIndex + 1}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{currentClip.description}</p>
              <button onClick={startClip} className="px-6 py-3 rounded-lg font-semibold bg-teal-500 hover:bg-teal-600 text-white transition-transform duration-200 hover:scale-105 z-10">
                Start Clip
              </button>
            </div>
          )}

          {(clipState === 'playing' || clipState === 'finished') && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-base font-semibold drop-shadow-lg">{currentClip.description}</p>
              </div>
          )}

          {clipState === 'playing' && (
            <div 
              className={`absolute text-5xl select-none ${currentClip.hazard.positionClass} ${currentClip.hazard.animationClass}`}
              style={{ animationDuration: `${currentClip.duration}ms`}}
            >
              {currentClip.hazard.icon}
            </div>
          )}

          {feedback && clipState === 'finished' && (
             <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                <p className="text-3xl font-bold animate-fadeInUp text-white">{feedback}</p>
             </div>
          )}

          {/* Click indicator */}
          {clicks.length > 0 && clipState === 'playing' && (
            <div className="absolute h-16 w-16 border-4 border-red-500 rounded-full animate-ping" style={{top: 'calc(50% - 32px)', left: 'calc(50% - 32px)'}}></div>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mt-4">
          <div className="bg-teal-400 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
        </div>
      </main>
    </div>
  );
};

export default HazardPerceptionPage;