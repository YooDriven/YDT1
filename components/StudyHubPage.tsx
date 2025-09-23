import React from 'react';
import { Page, TestCardData } from '../types';
import { STUDY_CARDS } from '../constants';
import TestCard from './TestCard';
import { ChevronLeftIcon } from './icons';

interface StudyHubPageProps {
  navigateTo: (page: Page) => void;
  onCardClick: (card: TestCardData) => void;
  appAssets: Record<string, string>;
}

const StudyHubPage: React.FC<StudyHubPageProps> = ({ navigateTo, onCardClick, appAssets }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateTo(Page.Dashboard)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
            <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-base">Back to Dashboard</span>
          </button>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Study Hub</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Focus your learning with these tools and resources.</p>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {STUDY_CARDS.map((card, index) => (
          <TestCard key={card.id} card={card} index={index} onClick={onCardClick} appAssets={appAssets} />
        ))}
      </main>
    </div>
  );
};

export default StudyHubPage;