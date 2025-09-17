import React from 'react';
import { Page } from '../types';
import { HAZARD_PERCEPTION_PASS_MARK } from '../constants';

interface HazardPerceptionResultsPageProps {
  navigateTo: (page: Page) => void;
  scores: number[];
  totalScore: number;
  maxScore: number;
}

const Button: React.FC<{ children: React.ReactNode; onClick: () => void; className?: string }> = ({ children, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 rounded-lg font-semibold transition-transform duration-200 hover:scale-105 ${className}`}
    >
        {children}
    </button>
);

const HazardPerceptionResultsPage: React.FC<HazardPerceptionResultsPageProps> = ({ navigateTo, scores, totalScore, maxScore }) => {
  const passed = totalScore >= HAZARD_PERCEPTION_PASS_MARK;

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
      <div className="max-w-xl w-full text-center bg-white dark:bg-slate-800/50 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 animate-fadeInUp shadow-2xl shadow-gray-200/50 dark:shadow-none">
        <h1 className={`text-5xl font-extrabold ${passed ? 'text-teal-500 dark:text-teal-400' : 'text-red-500'}`}>
          {passed ? 'PASS' : 'FAIL'}
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">Your Hazard Perception Score</p>
        <p className="text-6xl font-bold my-2 text-gray-900 dark:text-white">{totalScore}<span className="text-3xl text-gray-400">/{maxScore}</span></p>
        
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          {passed
            ? "Great awareness! You've successfully identified the developing hazards."
            : "Keep practicing. The key is to spot hazards as they develop, not too early or too late."}
        </p>
        
        <div className="text-left bg-gray-100 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 mb-10">
            <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {scores.map((score, index) => (
                    <div key={index} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                        <span>Clip {index + 1}:</span>
                        <span className={`font-bold ${score > 0 ? 'text-teal-500 dark:text-teal-400' : 'text-red-500'}`}>{score} points</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => navigateTo(Page.HazardPerception)} className="bg-gray-600 hover:bg-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white">
                Try Again
            </Button>
            <Button onClick={() => navigateTo(Page.Dashboard)} className="bg-teal-500 hover:bg-teal-600 text-white">
                Back to Dashboard
            </Button>
        </div>
      </div>
    </div>
  );
};

export default HazardPerceptionResultsPage;