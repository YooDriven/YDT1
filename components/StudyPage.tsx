import React from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from './icons';

interface StudyPageProps {
    navigateTo: (page: Page) => void;
    topic: string;
}

const StudyPage: React.FC<StudyPageProps> = ({ navigateTo, topic }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigateTo(Page.TopicSelection)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Topics</span>
            </button>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Study: {topic}</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">This feature is coming soon!</p>
        </header>
        <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Study mode content will appear here.</p>
        </div>
    </div>
  );
};

export default StudyPage;