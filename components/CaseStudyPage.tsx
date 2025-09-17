import React, { useState, useMemo } from 'react';
import { Page, Question, CaseStudy } from '../types';
import { ChevronLeftIcon } from './icons';

interface CaseStudyPageProps {
  navigateTo: (page: Page) => void;
  onTestComplete: (score: number, questions: Question[], userAnswers: (number | null)[]) => void;
  caseStudy: CaseStudy;
  allQuestions: Question[];
}

type ViewState = 'scenario' | 'questions';

const CaseStudyPage: React.FC<CaseStudyPageProps> = ({ navigateTo, onTestComplete, caseStudy, allQuestions }) => {
    const [viewState, setViewState] = useState<ViewState>('scenario');
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const studyQuestions = useMemo(() => {
        const questionMap = new Map(allQuestions.map(q => [q.id, q]));
        const questions = caseStudy.question_ids.map(id => questionMap.get(id)).filter(Boolean) as Question[];
        setUserAnswers(new Array(questions.length).fill(null));
        return questions;
    }, [caseStudy, allQuestions]);

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
        onTestComplete(score, studyQuestions, userAnswers);
    };

    if (studyQuestions.length === 0) {
        return <div className="p-8 text-center">Loading case study questions...</div>;
    }

    const currentQuestion = studyQuestions[currentQuestionIndex];
    const selectedAnswer = userAnswers[currentQuestionIndex];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="flex justify-between items-center mb-4">
                <button onClick={() => navigateTo(Page.CaseStudySelection)} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Back to Selection
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{caseStudy.title}</h1>
                 <div className="w-24"></div> {/* Spacer */}
            </header>

            {viewState === 'scenario' && (
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Scenario</h2>
                    {caseStudy.scenario_image && (
                         <img src={caseStudy.scenario_image} alt="Case study scenario" className="max-w-full h-auto rounded-lg mb-4" />
                    )}
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{caseStudy.scenario}</p>
                     <button
                        onClick={() => setViewState('questions')}
                        className="w-full mt-6 bg-[#008485] text-white font-bold py-3 rounded-lg hover:bg-[#007374] transition-colors"
                    >
                        Start Questions
                    </button>
                </div>
            )}

            {viewState === 'questions' && (
                <div>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                            <button onClick={() => setViewState('scenario')} className="flex items-center">
                                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                                View Scenario
                            </button>
                            <div className="font-bold text-lg text-gray-900 dark:text-white">{currentQuestionIndex + 1} of {studyQuestions.length}</div>
                            <div className="w-24"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{currentQuestion.question}</h2>
                                <div className="space-y-2">
                                    {currentQuestion.options.map((option, index) => (
                                        <label 
                                            key={index} 
                                            className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition-colors ${selectedAnswer === index ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-gray-200 dark:border-slate-600'}`}
                                            onClick={() => handleSelectAnswer(index)}
                                        >
                                            <div className="flex-shrink-0 h-6 w-6 rounded-sm border-2 border-gray-300 dark:border-slate-500 flex items-center justify-center mr-3">
                                                {selectedAnswer === index && <div className="h-4 w-4 bg-teal-500 rounded-sm" />}
                                            </div>
                                            <span className="text-gray-800 dark:text-gray-300">{option.text}</span>
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
                                className="w-full bg-[#008485] text-white font-bold py-4 rounded-lg hover:bg-[#007374] transition-colors"
                            >
                                Next Question
                            </button>
                        ) : (
                            <button
                                onClick={handleFinishTest}
                                className="w-full bg-[#008485] text-white font-bold py-4 rounded-lg hover:bg-[#007374] transition-colors"
                            >
                                Finish Case Study
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseStudyPage;
