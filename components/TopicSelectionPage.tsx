
import React, { useMemo } from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from './icons';
import { useQuestions } from '../contexts/QuestionsContext';
import { useApp } from '../contexts/AppContext';
import { useGlobalState } from '../contexts/GlobalStateContext';

const TopicSelectionPage: React.FC = () => {
    const { navigateTo } = useApp();
    const { handleTopicSelect, currentMode } = useGlobalState();
    const { questions: allQuestions, loading } = useQuestions();
    const title = currentMode === 'test' ? 'Topic Tests' : 'Study Mode';
    const description = currentMode === 'test' 
        ? 'Choose a topic to start a focused quiz.' 
        : 'Choose a topic to review questions and answers.';

    const topics = useMemo(() => {
        if (loading) return [];
        const uniqueTopics = new Set(allQuestions.map(q => q.category));
        return Array.from(uniqueTopics).sort();
    }, [allQuestions, loading]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateTo(Page.StudyHub)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
            <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-base">Back to Study Hub</span>
          </button>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{title}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{description}</p>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading topics...</p>
        ) : (
            topics.map((topic, index) => (
                <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className="stagger-fade-in p-6 bg-white dark:bg-slate-800 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 transition-all transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{topic}</h2>
                </button>
            ))
        )}
      </main>
    </div>
  );
};

export default TopicSelectionPage;
