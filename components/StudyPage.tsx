import React, { useState, useMemo } from 'react';
import { Page, Question } from '../types';
import { ChevronLeftIcon } from './icons';
import { useQuestions } from '../contexts/QuestionsContext';

interface StudyPageProps {
    navigateTo: (page: Page) => void;
    topic: string;
}

const StudyPage: React.FC<StudyPageProps> = ({ navigateTo, topic }) => {
    const { questions: allQuestions, loading } = useQuestions();
    const [currentIndex, setCurrentIndex] = useState(0);

    const topicQuestions = useMemo(() => {
        if (loading) return [];
        return allQuestions.filter(q => q.category === topic);
    }, [allQuestions, topic, loading]);
    
    const currentQuestion = topicQuestions[currentIndex];

    if (loading) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading questions...</div>;
    }

    if (topicQuestions.length === 0) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto text-center">
                <header className="mb-8 text-left">
                    <button onClick={() => navigateTo(Page.TopicSelection)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Topics</span>
                    </button>
                </header>
                <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No questions found for "{topic}"</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Please select another topic to study.</p>
                </div>
            </div>
        );
    }

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
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">Review questions and explanations at your own pace.</p>
            </header>

            <main>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">Question {currentIndex + 1} of {topicQuestions.length}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{currentQuestion.question}</h2>
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                    const isCorrect = index === currentQuestion.correctAnswer;
                                    return (
                                        <div 
                                            key={index} 
                                            className={`flex items-start p-3 rounded-md border-2 ${isCorrect ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-gray-200 dark:border-slate-600'}`}
                                        >
                                            <div className="flex-shrink-0 font-bold text-gray-800 dark:text-gray-300 mr-3">{String.fromCharCode(65 + index)}.</div>
                                            {option.text && <span className="text-gray-800 dark:text-gray-300">{option.text}</span>}
                                            {option.image && <img src={option.image} alt={`Option ${index+1}`} className="w-full h-auto rounded" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {currentQuestion.questionImage && (
                            <div className="flex justify-center">
                                <img src={currentQuestion.questionImage} alt="Question visual aid" className="max-w-full h-auto rounded-lg" />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Explanation</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-between">
                    <button
                        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                        className="bg-white dark:bg-slate-800 text-[#008485] font-bold py-3 px-6 rounded-lg border-2 border-[#008485] hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentIndex(i => Math.min(topicQuestions.length - 1, i + 1))}
                        disabled={currentIndex === topicQuestions.length - 1}
                        className="bg-[#008485] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#007374] transition-colors disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </main>
        </div>
    );
};

export default StudyPage;
