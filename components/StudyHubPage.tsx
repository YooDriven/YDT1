import React from 'react';
import { Page } from '../types';
import { STUDY_CARDS } from '../constants';
import TestCard from './TestCard';
import { ChevronLeftIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';

const StudyHubPage: React.FC = () => {
  const { navigateTo, handleCardClick, appAssets } = useAppContext();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Study Hub</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Focus your learning with these tools and resources.</p>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {STUDY_CARDS.map((card, index) => (
          <TestCard key={card.id} card={card} index={index} onClick={handleCardClick} appAssets={appAssets} />
        ))}
      </main>
    </div>
  );
};

export default StudyHubPage;