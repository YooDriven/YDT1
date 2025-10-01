
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Page, Question } from '../types';
import { useQuestions } from '../contexts/QuestionsContext';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui';
import { MicrophoneIcon, ChevronLeftIcon } from './icons';

type SessionState = 'idle' | 'starting' | 'asking' | 'listening' | 'finished';

const VoicePracticePage: React.FC = () => {
  const { navigateTo } = useApp();
  const { questions: allQuestions, loading: questionsLoading } = useQuestions();
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
        console.warn("Speech synthesis not supported in this browser.");
        if (onEnd) onEnd();
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = onEnd || null;
    synthRef.current.speak(utterance);
  }, []);

  const startSession = () => {
    setSessionState('starting');
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const sessionQuestions = shuffled.slice(0, 10);
    setPracticeQuestions(sessionQuestions);
    setCurrentIndex(0);
    setScore(0);
    speak("Starting voice practice session with 10 questions. Let's begin.", () => {
      setSessionState('asking');
    });
  };

  const askQuestion = useCallback(() => {
    if (currentIndex >= practiceQuestions.length) {
      setSessionState('finished');
      return;
    }
    const question = practiceQuestions[currentIndex];
    setSelectedAnswer(null);
    setIsRoundOver(false);

    let textToSpeak = `Question ${currentIndex + 1}. ${question.question}. `;
    question.options.forEach((option, index) => {
      if (option.text) {
        textToSpeak += `Option ${String.fromCharCode(65 + index)}: ${option.text}. `;
      }
    });

    speak(textToSpeak, () => {
      setSessionState('listening');
    });
  }, [currentIndex, practiceQuestions, speak]);

  useEffect(() => {
    if (sessionState === 'asking' && practiceQuestions.length > 0) {
      askQuestion();
    }
    
    if(sessionState === 'finished') {
        speak(`Session complete. You scored ${score} out of ${practiceQuestions.length}. Well done!`);
    }
    
    return () => {
      synthRef.current.cancel();
    }
  }, [sessionState, askQuestion, practiceQuestions, score, speak]);

  const handleAnswerSelect = (index: number) => {
    if (isRoundOver) return;
    setSelectedAnswer(index);
    const question = practiceQuestions[currentIndex];
    const isCorrect = index === question.correctAnswer;
    setIsRoundOver(true);

    if (isCorrect) {
      setScore(s => s + 1);
      speak("Correct!", () => {
        setTimeout(() => {
          setCurrentIndex(i => i + 1);
          setSessionState('asking');
        }, 1500);
      });
    } else {
      const correctOptionLetter = String.fromCharCode(65 + question.correctAnswer);
      speak(`That's not quite right. The correct answer was ${correctOptionLetter}.`, () => {
        setTimeout(() => {
          setCurrentIndex(i => i + 1);
          setSessionState('asking');
        }, 2500);
      });
    }
  };

  const currentQuestion = practiceQuestions[currentIndex];

  const renderContent = () => {
    if (sessionState === 'idle' || sessionState === 'starting') {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready for Voice Practice?</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The app will read 10 questions aloud. Answer using the on-screen buttons.</p>
          <Button onClick={startSession} disabled={sessionState === 'starting'} className="mt-6">
            {sessionState === 'starting' ? 'Preparing questions...' : 'Start Session'}
          </Button>
        </div>
      );
    }
    
    if (sessionState === 'finished') {
        return (
             <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Session Complete!</h2>
                <p className="mt-4 text-5xl font-bold text-teal-500">{score} <span className="text-3xl text-gray-400">/ {practiceQuestions.length}</span></p>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Well done!</p>
                <div className="flex gap-4 justify-center mt-8">
                    <Button onClick={startSession}>Start a New Session</Button>
                    <Button onClick={() => navigateTo(Page.StudyHub)} variant="secondary">Back to Study Hub</Button>
                </div>
            </div>
        )
    }

    if (!currentQuestion) {
      return <p>Loading question...</p>;
    }
    
    const progressPercentage = practiceQuestions.length > 0 ? ((currentIndex + 1) / practiceQuestions.length) * 100 : 0;

    return (
      <>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mb-4">
            <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
        </div>
        <div className="text-center mb-6">
            <p className="font-semibold text-lg text-gray-900 dark:text-white">Question {currentIndex + 1} of {practiceQuestions.length}</p>
            <h2 className="text-2xl font-semibold my-4 text-gray-900 dark:text-white leading-tight">{currentQuestion.question}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
            let buttonClass = 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-teal-500';
            if (isRoundOver) {
                if(index === currentQuestion.correctAnswer) {
                    buttonClass = 'bg-green-100 dark:bg-green-500/20 border-green-500 text-green-800 dark:text-white';
                } else if (index === selectedAnswer) {
                    buttonClass = 'bg-red-100 dark:bg-red-500/20 border-red-500 text-red-800 dark:text-white';
                } else {
                    buttonClass = 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-50';
                }
            }
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isRoundOver}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 disabled:cursor-not-allowed ${buttonClass} flex items-center`}
              >
                <span className="font-semibold mr-3 text-gray-900 dark:text-white">{String.fromCharCode(65 + index)}.</span>
                <span className="text-base text-gray-800 dark:text-gray-300 leading-snug">{option.text}</span>
              </button>
            );
          })}
        </div>
        <div className="text-center mt-6">
            <Button onClick={() => setSessionState('finished')} variant="danger">End Session</Button>
        </div>
      </>
    );
  };
  
  if (questionsLoading) {
      return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading questions for practice...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <MicrophoneIcon className="h-9 w-9" /> Voice Practice
        </h1>
         <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <strong>Demonstration Mode:</strong> AI-powered voice recognition is disabled to prevent API costs. The app will read questions to you, and you can answer using the on-screen buttons.
        </div>
      </header>

      <main className="p-6 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 min-h-[30rem] flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default VoicePracticePage;