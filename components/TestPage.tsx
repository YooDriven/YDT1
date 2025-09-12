import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Question } from '../types';
import { ChevronLeftIcon, FlagIcon } from './icons';

interface TestPageProps {
  navigateTo: (page: Page) => void;
  onTestComplete: (score: number, questions: Question[], userAnswers: (number | null)[], topic?: string, testId?: string) => void;
  totalQuestions: number;
  allQuestions: Question[];
  customQuestions?: Question[] | null;
  testId?: string;
  timeLimit?: number;
  topic?: string;
  bookmarkedQuestions: string[];
  onToggleBookmark: (questionId: string) => void;
}

const TestPage: React.FC<TestPageProps> = ({ navigateTo, onTestComplete, totalQuestions, allQuestions, customQuestions, testId, timeLimit = 3570, topic, bookmarkedQuestions, onToggleBookmark }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    
    const finishTestHandlerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (allQuestions.length === 0 && !customQuestions) return;

        let testQuestions: Question[];
        if (customQuestions) {
            testQuestions = customQuestions;
        } else if (topic) {
            testQuestions = allQuestions.filter(q => q.category === topic);
        } else {
            testQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, totalQuestions);
        }
        setQuestions(testQuestions);
        setUserAnswers(new Array(testQuestions.length).fill(null));
    }, [totalQuestions, customQuestions, topic, allQuestions]);

    useEffect(() => {
        finishTestHandlerRef.current = () => {
            let score = 0;
            userAnswers.forEach((answer, index) => {
                if (questions[index] && answer === questions[index].correctAnswer) {
                    score++;
                }
            });
            onTestComplete(score, questions, userAnswers, topic, testId);
        };
    }, [userAnswers, questions, onTestComplete, topic, testId]);


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

    if (questions.length === 0) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading test...</div>;
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = userAnswers[currentQuestionIndex];
    const isBookmarked = currentQuestion && bookmarkedQuestions.includes(currentQuestion.id);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <button onClick={() => navigateTo(Page.Dashboard)} className="text-sm text-gray-600 dark:text-gray-400 flex items-center self-start">
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center sm:text-left">{topic ? `Topic: ${topic}`: 'Theory Test'}</h1>
                <div className="text-right bg-gray-100 dark:bg-slate-800 p-2 rounded-lg self-end sm:self-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time Remaining:</span>
                    <span className="font-bold text-red-500 text-lg ml-2">{formatTime(timeLeft)}</span>
                </div>
            </header>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <button 
                        onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center disabled:opacity-50"
                    >
                         <ChevronLeftIcon className="h-4 w-4 mr-1" />
                         Previous
                    </button>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{currentQuestionIndex + 1} of {questions.length}</div>
                    <button 
                        onClick={() => onToggleBookmark(currentQuestion.id)}
                        className={`transition-colors ${isBookmarked ? 'text-teal-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    >
                        <FlagIcon className="h-5 w-5" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{currentQuestion.question}</h2>
                        <p className="text-sm text-red-500 mb-4">Mark one answer</p>
                        <div className={`grid ${currentQuestion.options[0]?.image ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-2'}`}>
                            {currentQuestion.options.map((option, index) => (
                                <label 
                                    key={index} 
                                    className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition-colors ${selectedAnswer === index ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-gray-200 dark:border-slate-600'}`}
                                    onClick={() => handleSelectAnswer(index)}
                                >
                                    <div className="flex-shrink-0 h-6 w-6 rounded-sm border-2 border-gray-300 dark:border-slate-500 flex items-center justify-center mr-3">
                                        {selectedAnswer === index && <div className="h-4 w-4 bg-teal-500 rounded-sm" />}
                                    </div>
                                    {option.text && <span className="text-gray-800 dark:text-gray-300">{option.text}</span>}
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
                        className="w-full bg-[#008485] text-white font-bold py-4 rounded-lg hover:bg-[#007374] transition-colors"
                    >
                        Next Question
                    </button>
                ) : (
                    <button
                        onClick={handleFinishTest}
                        className="w-full bg-[#008485] text-white font-bold py-4 rounded-lg hover:bg-[#007374] transition-colors"
                    >
                        Finish Test
                    </button>
                )}
            </div>
        </div>
    );
};

export default TestPage;