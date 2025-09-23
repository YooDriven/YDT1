import React, { useMemo } from 'react';
import { Page, Question } from '../types';
import { ChevronLeftIcon, BookmarkIcon, FlagIcon } from './icons';
import { useQuestions } from '../contexts/QuestionsContext';

interface BookmarkedQuestionsPageProps {
    navigateTo: (page: Page) => void;
    bookmarkedQuestions: string[];
    onToggleBookmark: (questionId: string) => void;
}

const BookmarkedQuestionsPage: React.FC<BookmarkedQuestionsPageProps> = ({ navigateTo, bookmarkedQuestions, onToggleBookmark }) => {
    const { questions: allQuestions, loading } = useQuestions();

    const bookmarked = useMemo(() => {
        if (loading) return [];
        const bookmarkedSet = new Set(bookmarkedQuestions);
        return allQuestions.filter(q => bookmarkedSet.has(q.id));
    }, [allQuestions, bookmarkedQuestions, loading]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateTo(Page.StudyHub)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                    <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                    <span className="text-base">Back to Study Hub</span>
                </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Bookmarked Questions</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    Review questions you have saved. The correct answer is highlighted in green.
                </p>
            </header>
            
            <main className="space-y-6">
                {loading ? (
                     <div className="text-center py-16">
                        <p className="text-gray-500 dark:text-gray-400">Loading bookmarked questions...</p>
                    </div>
                ) : bookmarked.length > 0 ? (
                    bookmarked.map((question, index) => (
                        <div key={question.id} className="stagger-fade-in bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold leading-tight text-gray-900 dark:text-white flex-1">
                                    {index + 1}. {question.question}
                                </h3>
                                <button
                                    onClick={() => onToggleBookmark(question.id)}
                                    className="text-yellow-500 hover:text-yellow-600 ml-4"
                                    aria-label="Remove bookmark"
                                >
                                    <BookmarkIcon className="h-6 w-6" fill="currentColor" />
                                </button>
                            </div>
                            <div className="space-y-3 mb-4">
                                {question.options.map((option, optionIndex) => {
                                    const isCorrect = optionIndex === question.correctAnswer;
                                    return (
                                        <div key={optionIndex} className={`p-3 rounded-lg border flex items-center ${
                                            isCorrect 
                                            ? 'bg-green-100 dark:bg-green-500/20 border-green-500' 
                                            : 'border-gray-200 dark:border-slate-700'
                                        }`}>
                                            <span className={`font-semibold mr-2 ${isCorrect ? 'text-green-800 dark:text-white' : 'text-gray-800 dark:text-gray-300'}`}>{String.fromCharCode(65 + optionIndex)}.</span>
                                            {option.text && <span className={`text-base leading-snug ${isCorrect ? 'text-green-800 dark:text-white' : 'text-gray-800 dark:text-gray-300'}`}>{option.text}</span>}
                                            {option.image && <img src={option.image} alt={`Option ${optionIndex + 1}`} className="h-24 rounded" />}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">{question.explanation}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
                        <BookmarkIcon className="h-12 w-12 mx-auto text-gray-400" />
                        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No Bookmarked Questions</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Click the flag icon <FlagIcon className="inline h-4 w-4" /> during a test to save a question for later.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BookmarkedQuestionsPage;