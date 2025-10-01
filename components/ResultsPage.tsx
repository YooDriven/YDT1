
import React from 'react';
import { Page } from '../types';
import { PASS_PERCENTAGE } from '../constants';
import { XMarkIcon, ShareIcon } from './icons';
import { Button } from './ui';
import { useApp } from '../contexts/AppContext';
import { useGlobalState } from '../contexts/GlobalStateContext';

const CircularProgress: React.FC<{ percentage: number; passed: boolean; score: number; totalQuestions: number; }> = ({ percentage, passed, score, totalQuestions }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-40 w-40">
      <svg className="h-full w-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200 dark:text-slate-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={passed ? 'text-teal-500' : 'text-red-500'}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-4xl ${passed ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-500'}`}>
          {percentage}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{score} / {totalQuestions}</span>
      </div>
    </div>
  );
};


const ResultsPage: React.FC = () => {
  const { navigateTo } = useApp();
  const { testResult } = useGlobalState();
  const { score, total: totalQuestions } = testResult;

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= PASS_PERCENTAGE;
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'I took a theory test!',
        text: `I just scored ${percentage}% on my practice theory test! (${score}/${totalQuestions})`,
        url: window.location.href,
      }).catch(error => console.error('Error sharing', error));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp">
        <div className="relative max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 text-center" style={{ animation: 'scaleIn 0.3s ease-out forwards' }}>
            <button onClick={() => navigateTo(Page.Dashboard)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight leading-none animate-fadeInUp" style={{ animationDelay: '100ms' }}>Test Complete!</h1>
            
            <div className="my-6 flex flex-col items-center justify-center animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <CircularProgress percentage={percentage} passed={passed} score={score} totalQuestions={totalQuestions}/>
                 {passed ? (
                    <span className="mt-4 text-xs font-bold text-white bg-teal-500 px-3 py-1 rounded-full uppercase tracking-wider">PASS</span>
                ) : (
                    <span className="mt-4 text-xs font-bold text-white bg-red-500 px-3 py-1 rounded-full uppercase tracking-wider">FAIL</span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                <Button 
                    onClick={() => navigateTo(Page.Review)}
                    variant="primary"
                    className="w-full !py-3"
                >
                    Review Answers
                </Button>
                <Button
                    onClick={() => navigateTo(Page.Dashboard)}
                    variant="outline"
                     className="w-full !py-3"
                >
                    Go to Dashboard
                </Button>
            </div>
             {navigator.share && (
                <div className="mt-4 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                    <Button onClick={handleShare} variant="secondary" className="w-full !py-3">
                        <ShareIcon className="h-5 w-5 mr-2" /> Share Results
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
};

export default ResultsPage;
