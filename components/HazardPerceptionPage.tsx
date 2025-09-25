import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HazardPerceptionClip } from '../types';
import { supabase } from '../lib/supabaseClient';
import { MAX_SCORE_PER_CLIP } from '../constants';
import Tooltip from './Tooltip';
import { useGameplay } from '../contexts/GameplayContext';

const HazardPerceptionPage: React.FC = () => {
  const { handleHazardPerceptionComplete } = useGameplay();
  const [clips, setClips] = useState<HazardPerceptionClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [clipState, setClipState] = useState<'intro' | 'ready' | 'playing' | 'finished'>('intro');
  const [progress, setProgress] = useState(0);
  const [clicks, setClicks] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchClips = async () => {
      setLoading(true);
      const { data, error } = await supabase!.from('hazard_clips').select('*');
      if (error) {
        setError(error.message);
      } else if (data) {
        const mappedClips = data.map(clip => ({
          id: clip.id,
          description: clip.description,
          duration: clip.duration,
          videoUrl: clip.video_url,
          hazardWindowStart: clip.hazard_window_start,
          hazardWindowEnd: clip.hazard_window_end,
        }));
        setClips(mappedClips.sort(() => 0.5 - Math.random()));
        setClipState('ready');
      }
      setLoading(false);
    };
    fetchClips();
  }, []);

  const currentClip = clips[currentClipIndex];

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      setProgress((currentTime / duration) * 100);
    }
  };

  const startClip = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setClipState('playing');
      setClicks([]);
      setFeedback(null);
    }
  };
  
  const calculateScore = useCallback(() => {
    if (!currentClip || clicks.length === 0) return 0;
    if (clicks.length > 1) return 0;

    const clickProgress = clicks[0];
    const { hazardWindowStart, hazardWindowEnd } = currentClip;

    if (clickProgress >= hazardWindowStart && clickProgress <= hazardWindowEnd) {
      const windowSize = hazardWindowEnd - hazardWindowStart;
      if (windowSize <= 0) return MAX_SCORE_PER_CLIP;
      const positionInWindow = (clickProgress - hazardWindowStart) / windowSize;
      return Math.max(1, Math.round(MAX_SCORE_PER_CLIP * (1 - positionInWindow)));
    }
    return 0;
  }, [clicks, currentClip]);

  const finishClip = useCallback(() => {
    setClipState('finished');
    const score = calculateScore();
    const newScores = [...scores, score];
    setScores(newScores);
    setFeedback(`Clip score: ${score}`);

    setTimeout(() => {
      const nextClipIndex = currentClipIndex + 1;
      if (nextClipIndex < clips.length) {
        setCurrentClipIndex(nextClipIndex);
        setClipState('ready');
        setProgress(0);
      } else {
        handleHazardPerceptionComplete(newScores, clips.length);
      }
    }, 2000);
  }, [calculateScore, scores, currentClipIndex, handleHazardPerceptionComplete, clips.length]);


  const handlePlayerClick = () => {
    if (clipState !== 'playing' || !videoRef.current) return;
    const clickProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setClicks(prev => [...prev, clickProgress]);
  };
  
  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Hazard Perception Test...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading clips: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-4">
        <div className="flex justify-between items-baseline mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Hazard Perception</h1>
            <div className="flex items-center space-x-2">
                <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">Clip {currentClipIndex + 1} of {clips.length}</p>
                <Tooltip text="Click when you see a developing hazard. Score up to 5 points based on how quickly you react. Clicking more than once per clip results in a score of 0." />
            </div>
        </div>
         <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full">
            <div className="flex justify-between">
                {clips.map((_, index) => (
                    <div key={index} className="flex-1 px-0.5">
                        <div className={`h-2 rounded-full ${index < currentClipIndex ? 'bg-teal-600' : 'bg-transparent'} ${index === currentClipIndex ? 'bg-teal-600/50' : ''}`} />
                    </div>
                ))}
            </div>
        </div>
      </header>
      
      <main>
        <div 
          className="relative w-full aspect-video bg-black rounded-lg border-2 border-gray-300 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={handlePlayerClick}
        >
          {currentClip && (
            <video
              ref={videoRef}
              src={currentClip.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={finishClip}
              className="w-full h-full"
              playsInline
              muted
            />
          )}

          {clipState === 'ready' && currentClip && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
              <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Clip {currentClipIndex + 1}</h3>
              <p className="text-base text-gray-300 mb-6 max-w-md leading-relaxed">{currentClip.description}</p>
              <button onClick={startClip} className="px-6 py-3 rounded-lg font-semibold bg-teal-500 hover:bg-teal-600 text-white transition-transform duration-200 hover:scale-105 z-10">
                Start Clip
              </button>
            </div>
          )}

          {feedback && clipState === 'finished' && (
             <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                <p className="text-3xl font-bold animate-fadeInUp text-white">{feedback}</p>
             </div>
          )}

          {clicks.length > 0 && clipState === 'playing' && (
            <div key={clicks.length} className="absolute bottom-4 right-4 h-8 w-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold animate-ping-once">
              !
            </div>
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
