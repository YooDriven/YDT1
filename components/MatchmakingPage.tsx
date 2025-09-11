import React, { useEffect, useState } from 'react';
import { Page } from '../types';

interface MatchmakingPageProps {
  navigateTo: (page: Page) => void;
}

const matchmakingSteps = [
    { text: "Searching for opponent...", duration: 2000 },
    { text: "Opponent found!", duration: 1500 },
    { text: "Starting match...", duration: 1000 },
];

const MatchmakingPage: React.FC<MatchmakingPageProps> = ({ navigateTo }) => {
    const [step, setStep] = useState(0);
    const [playersOnline] = useState(Math.floor(Math.random() * (1200 - 400 + 1)) + 400);

  useEffect(() => {
    if (step < matchmakingSteps.length) {
        const timer = setTimeout(() => {
            setStep(step + 1);
        }, matchmakingSteps[step].duration);
        return () => clearTimeout(timer);
    } else {
        navigateTo(Page.BattleGround);
    }
  }, [step, navigateTo]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="relative flex items-center justify-center h-40 w-40">
            <div className="absolute h-full w-full rounded-full bg-teal-500/20 animate-ping"></div>
            <div className="absolute h-28 w-28 rounded-full bg-teal-500/30 animate-ping delay-150"></div>
            <p className="text-5xl font-bold text-gray-800 dark:text-white">VS</p>
        </div>

      <h1 className="text-3xl font-bold mt-10 transition-opacity duration-500 text-gray-900 dark:text-white">
        {matchmakingSteps[step]?.text || 'Loading...'}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
        {playersOnline} players online
      </p>

      <button
        onClick={() => navigateTo(Page.Dashboard)}
        className="mt-12 px-6 py-3 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white transition-all duration-200 hover:scale-105"
      >
        Cancel Search
      </button>
    </div>
  );
};

export default MatchmakingPage;