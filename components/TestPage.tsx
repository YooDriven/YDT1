
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Question } from '../types';
import { ChevronLeftIcon, FlagIcon } from './icons';
import { useQuestions } from '../contexts/QuestionsContext';
import { getDailyChallengeQuestions } from '../utils';
import { useApp } from '../contexts/AppContext';
import { useGlobalState } from '../contexts/GlobalStateContext';

const TestPage: React.FC = () => {
    const { navigateTo } = useApp();
    const { userProfile, handleTestComplete, customTest, currentTestId, timeLimit = 3570, currentTopic, handleToggleBookmark } = useGlobalState();
    
    const totalQuestions = customTest ? customTest.length : 50;
    const bookmarkedQuestions = userProfile?.bookmarkedQuestions || [];

    const [questions, setQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    
    const { questions: allQuestions, loading: questionsLoading } = useQuestions();
    const finishTestHandlerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (questionsLoading) return;

        let testQuestions: Question[];
        if (currentTestId === 'daily-challenge') {
            testQuestions = getDailyChallengeQuestions(allQuestions, 10);
        } else if (customTest) {
            testQuestions = customTest;
        } else if (currentTopic) {
            testQuestions = allQuestions.filter(q => q.category === currentTopic);
        } else {
            testQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, totalQuestions);
        }
        setQuestions(testQuestions);
        setUserAnswers(new Array(testQuestions.length).fill(null));
    }, [totalQuestions, customTest, currentTopic, allQuestions, questionsLoading, currentTestId]);

    useEffect(() => {
        finishTestHandlerRef.current = () => {
            let score = 0;
            userAnswers.forEach((answer, index) => {
                if (questions[index] && answer === questions[index].correctAnswer) {
                    score++;
                }
            });
            handleTestComplete(score, questions, userAnswers, currentTopic, currentTestId);
        };
    }, [userAnswers, questions, handleTestComplete, currentTopic, currentTestId]);


    useEffect(() => {
        if (timeLeft <= 0) {
            finishTestHandlerRef.current?.();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft]);

    const handleSelectAnswer = (optionIndex: number) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };
    
    const handleFinishTest = () => {
        finishTestHandlerRef.current?.();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (questionsLoading || questions.length === 0) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading test...</div>;
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = userAnswers[currentQuestionIndex];
    const isBookmarked = currentQuestion && bookmarkedQuestions.includes(currentQuestion.id);
    const progressPercentage = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                    <button onClick={() => navigateTo(Page.Dashboard)} className="text-sm text-gray-600 dark:text-gray-400 flex items-center self-start p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Exit Test
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center sm:text-left tracking-tight">{currentTopic ? `Topic: ${currentTopic}`: 'Theory Test'}</h1>
                    <div className="text-right bg-gray-100 dark:bg-slate-800 p-2 rounded-lg self-end sm:self-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Time Remaining:</span>
                        <span className="font-bold text-red-600 dark:text-red-500 text-lg ml-2">{formatTime(timeLeft)}</span>
                    </div>
                </div>
                 <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                </div>
            </header>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <button 
                        onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center disabled:opacity-50 transition-opacity p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                         <ChevronLeftIcon className="h-4 w-4 mr-1" />
                         Previous
                    </button>
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">{currentQuestionIndex + 1} of {questions.length}</div>
                    <button 
                        onClick={() => handleToggleBookmark(currentQuestion.id)}
                        className={`transition-colors p-2 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-500/10 ${isBookmarked ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    >
                        <FlagIcon className="h-5 w-5" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white leading-tight">{currentQuestion.question}</h2>
                        <p className="text-sm text-red-600 dark:text-red-500 mb-4">Mark one answer</p>
                        <div className={`grid ${currentQuestion.options[0]?.image ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-2'}`}>
                            {currentQuestion.options.map((option, index) => (
                                <label 
                                    key={index} 
                                    className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-px active:scale-[0.99] ${selectedAnswer === index ? 'border-teal-600 bg-teal-50 dark:bg-teal-500/10' : 'border-slate-300 dark:border-slate-600 hover:border-teal-500'}`}
                                    onClick={() => handleSelectAnswer(index)}
                                >
                                    <div className="flex-shrink-0 h-6 w-6 rounded-sm border-2 border-gray-300 dark:border-slate-500 flex items-center justify-center mr-3">
                                        {selectedAnswer === index && <div className="h-4 w-4 bg-teal-600 rounded-sm" />}
                                    </div>
                                    {option.text && <span className="text-base text-gray-800 dark:text-gray-300 leading-snug">{option.text}</span>}
                                    {option.image && <img src={option.image} alt={`Option ${index+1}`} className="w-full h-auto rounded" />}
                                </label>
                            ))}
                        </div>
                    </div>
                    {currentQuestion.questionImage && (
                        <div className="flex justify-center">
                            <img src={currentQuestion.questionImage} alt="Question visual aid" className="max-w-full h-auto rounded-lg" />
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-6">
                {currentQuestionIndex < questions.length - 1 ? (
                     <button
                        onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                        className="w-full bg-teal-600 text-white font-semibold py-4 rounded-lg hover:bg-teal-700 transition-colors transform hover:-translate-y-px active:scale-98"
                    >
                        Next Question
                    </button>
                ) : (
                    <button
                        onClick={handleFinishTest}
                        className="w-full bg-teal-600 text-white font-semibold py-4 rounded-lg hover:bg-teal-700 transition-colors transform hover:-translate-y-px active:scale-98"
                    >
                        Finish Test
                    </button>
                )}
            </div>
        </div>
    );
};

export default TestPage;
