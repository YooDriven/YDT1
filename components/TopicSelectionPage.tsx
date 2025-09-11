import React from 'react';
import { Page } from '../types';
import { TOPICS } from '../constants';
import { ChevronLeftIcon } from './icons';

interface TopicSelectionPageProps {
    navigateTo: (page: Page) => void;
    onTopicSelect: (topic: string) => void;
    mode: 'test' | 'study';
}

const TopicSelectionPage: React.FC<TopicSelectionPageProps> = ({ navigateTo, onTopicSelect, mode }) => {
    const title = mode === 'test' ? 'Topic Tests' : 'Study Mode';
    const description = mode === 'test' 
        ? 'Choose a topic to start a focused quiz.' 
        : 'Choose a topic to review questions and answers.';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateTo(Page.StudyHub)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
            <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Study Hub</span>
          </button>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">{description}</p>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map((topic, index) => (
            <button
                key={topic}
                onClick={() => onTopicSelect(topic)}
                className="stagger-fade-in p-6 bg-white dark:bg-slate-800 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 transition-all transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
            >
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">{topic}</h2>
            </button>
        ))}
      </main>
    </div>
  );
};

export default TopicSelectionPage;