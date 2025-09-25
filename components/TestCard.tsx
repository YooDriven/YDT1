import React, { memo } from 'react';
import type { TestCardData, AppAssetRecord } from '../types';
import { CheckCircleIcon } from './icons';
import DynamicAsset from './DynamicAsset';

interface TestCardProps {
  card: TestCardData;
  index: number;
  onClick: (card: TestCardData) => void;
  completed?: boolean;
  appAssets: AppAssetRecord;
}

const TestCard: React.FC<TestCardProps> = ({ card, index, onClick, completed, appAssets }) => {
  const { title, description, icon: iconKey, color, duration, comingSoon } = card;

  return (
    <div
      className="stagger-fade-in w-full h-full"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <button
        onClick={() => !comingSoon && !completed && onClick(card)}
        disabled={comingSoon || completed}
        className={`group relative w-full h-full p-6 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-300 text-center transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10 dark:hover:shadow-teal-500/10 border border-gray-200 dark:border-slate-700`}
      >
        {comingSoon && (
          <div className="absolute inset-0 bg-gray-100/70 dark:bg-slate-900/80 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
            <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">Coming Soon</span>
          </div>
        )}
        {completed && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm z-10">
            <CheckCircleIcon className="h-12 w-12 text-teal-500 dark:text-teal-400 mb-2" />
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">Completed Today</span>
          </div>
        )}
        <div className="flex flex-col h-full items-center">
          <div className="mb-4">
            <DynamicAsset asset={appAssets[iconKey]} className={`h-20 w-20 ${color} transition-colors`} />
          </div>
          <h3 className="text-xl font-semibold leading-tight text-gray-900 dark:text-white tracking-tight">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex-grow leading-relaxed">{description}</p>
          {duration && <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4">{duration}</p>}
        </div>
      </button>
    </div>
  );
};

export default memo(TestCard);