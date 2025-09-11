import React from 'react';
import { Page, Question } from '../types';
import { ChevronLeftIcon } from './icons';

interface ReviewPageProps {
  navigateTo: (page: Page) => void;
  reviewData: {
    questions: Question[];
    userAnswers: (number | null)[];
  };
}

const ReviewPage: React.FC<ReviewPageProps> = ({ navigateTo, reviewData }) => {
  const { questions, userAnswers } = reviewData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateTo(Page.Results)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
            <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Results</span>
          </button>
          <p className="text-lg font-bold text-gray-900 dark:text-white">Review Answers</p>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          Review your answers below. Correct answers are highlighted in green, and your incorrect answers are in red.
        </p>
      </header>

      <main className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = userAnswers[index];
          const isCorrect = userAnswer === question.correctAnswer;

          return (
            <div key={index} className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold leading-relaxed text-gray-900 dark:text-white mb-4">
                {index + 1}. {question.question}
              </h3>
              <div className="space-y-3 mb-4">
                {question.options.map((option, optionIndex) => {
                  let optionClass = 'border-gray-200 dark:border-slate-700';
                  let textClass = 'text-gray-800 dark:text-gray-300';
                  if (optionIndex === question.correctAnswer) {
                    optionClass = 'bg-green-100 dark:bg-green-500/20 border-green-500';
                    textClass = 'text-green-800 dark:text-white';
                  } else if (optionIndex === userAnswer) {
                    optionClass = 'bg-red-100 dark:bg-red-500/20 border-red-500';
                    textClass = 'text-red-800 dark:text-white';
                  }

                  return (
                    <div key={optionIndex} className={`p-3 rounded-lg border ${optionClass} flex items-center`}>
                      <span className={`font-semibold mr-2 ${textClass}`}>{String.fromCharCode(65 + optionIndex)}.</span>
                      {option.text && <span className={textClass}>{option.text}</span>}
                      {option.image && <img src={option.image} alt={`Option ${optionIndex + 1}`} className="h-24 rounded" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                 <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default ReviewPage;