import React, { useState, useMemo } from 'react';
import { Page, Question } from '../types';
import { ChevronLeftIcon } from './icons';
import { useQuestions } from '../contexts/QuestionsContext';
import { useAppContext } from '../contexts/AppContext';

type ViewState = 'scenario' | 'questions';

const CaseStudyPage: React.FC = () => {
    const { navigateTo, handleTestComplete, selectedCaseStudy } = useAppContext();
    const caseStudy = selectedCaseStudy!;

    const { questions: allQuestions, loading } = useQuestions();
    const [viewState, setViewState] = useState<ViewState>('scenario');
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const studyQuestions = useMemo(() => {
        if (loading) return [];
        const questionMap = new Map(allQuestions.map(q => [q.id, q]));
        const questions = caseStudy.question_ids.map(id => questionMap.get(id)).filter(Boolean) as Question[];
        setUserAnswers(new Array(questions.length).fill(null));
        return questions;
    }, [caseStudy, allQuestions, loading]);

    const handleSelectAnswer = (optionIndex: number) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };

    const handleFinishTest = () => {
        let score = 0;
        userAnswers.forEach((answer, index) => {
            if (studyQuestions[index] && answer === studyQuestions[index].correctAnswer) {
                score++;
            }
        });
        handleTestComplete(score, studyQuestions, userAnswers);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading case study questions...</div>;
    }

    if (viewState === 'scenario') {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <main className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-4">{caseStudy.title}</h1>
                    {caseStudy.scenario_image && <img src={caseStudy.scenario_image} alt="Scenario" className="w-full h-auto rounded-lg mb-4" />}
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: caseStudy.scenario }}/>
                    <button onClick={() => setViewState('questions')} className="mt-6 w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-colors transform hover:-translate-y-px active:scale-98">
                        Start Questions ({studyQuestions.length})
                    </button>
                </main>
            </div>
        );
    }

    const currentQuestion = studyQuestions[currentQuestionIndex];
    const selectedAnswer = userAnswers[currentQuestionIndex];
    const progressPercentage = studyQuestions.length > 0 ? ((currentQuestionIndex + 1) / studyQuestions.length) * 100 : 0;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="mb-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setViewState('scenario')} className="text-sm text-gray-600 dark:text-gray-400 flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Back to Scenario
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{caseStudy.title}</h1>
                    <div className="w-36"></div>
                </div>
                 <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                </div>
            </header>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">Question {currentQuestionIndex + 1} of {studyQuestions.length}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white leading-tight">{currentQuestion.question}</h2>
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
                {currentQuestionIndex < studyQuestions.length - 1 ? (
                     <button
                        onClick={() => setCurrentQuestionIndex(i => i + 1)}
                        className="w-full bg-teal-600 text-white font-semibold py-4 rounded-lg hover:bg-teal-700 transition-colors transform hover:-translate-y-px active:scale-98"
                    >
                        Next Question
                    </button>
                ) : (
                    <button
                        onClick={handleFinishTest}
                        className="w-full bg-teal-600 text-white font-semibold py-4 rounded-lg hover:bg-teal-700 transition-colors transform hover:-translate-y-px active:scale-98"
                    >
                        Finish Case Study
                    </button>
                )}
            </div>
        </div>
    );
};

export default CaseStudyPage;