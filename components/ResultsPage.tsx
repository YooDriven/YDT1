import React from 'react';
import { Page } from '../types';
import { PASS_PERCENTAGE } from '../constants';
import { XMarkIcon } from './icons';

interface ResultsPageProps {
  navigateTo: (page: Page) => void;
  score: number;
  totalQuestions: number;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ navigateTo, score, totalQuestions }) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= PASS_PERCENTAGE;
  
  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp">
        <div className="relative max-w-lg w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 text-center">
            <button onClick={() => navigateTo(Page.Dashboard)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Test Complete!</h1>

            <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-6 my-6 text-left">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg text-gray-800 dark:text-white">Your Results</h2>
                    {passed ? (
                        <span className="text-xs font-bold text-white bg-teal-500 px-3 py-1 rounded-full uppercase tracking-wider">PASS</span>
                    ) : (
                        <span className="text-xs font-bold text-white bg-red-500 px-3 py-1 rounded-full uppercase tracking-wider">FAIL</span>
                    )}
                </div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Score:</span>
                    <span className="font-bold text-2xl text-gray-900 dark:text-white">{score} / {totalQuestions}</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-gray-600 dark:text-gray-400">Percentage:</span>
                    <span className="font-bold text-2xl text-gray-900 dark:text-white">{percentage}%</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => navigateTo(Page.Review)}
                    className="w-full bg-[#008485] text-white font-bold py-3 rounded-lg hover:bg-[#007374] transition-colors"
                >
                    Review Answers
                </button>
                <button
                    onClick={() => navigateTo(Page.Dashboard)}
                    className="w-full bg-white dark:bg-slate-800 text-[#008485] font-bold py-3 rounded-lg border-2 border-[#008485] hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    </div>
  );
};

export default ResultsPage;