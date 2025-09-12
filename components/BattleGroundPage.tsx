import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Question, ChatMessage, LeaderboardEntry } from '../types';
import { ChevronLeftIcon } from './icons';
import { OPPONENT_CHAT_MESSAGES } from '../constants';
import { getAiOpponentAnswer, isGeminiConfigured } from '../lib/gemini';

interface BattleGroundPageProps {
  navigateTo: (page: Page) => void;
  onBattleComplete: (playerScore: number, opponentScore: number, total: number, opponentName: string) => void;
  allQuestions: Question[];
  opponent?: LeaderboardEntry | null;
}

const opponentNames = ["RoadRunner", "DriftKing", "CaptainClutch", "SpeedyGonzales"];

const ChatBox: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => {
    const chatEndRef = useRef<null | HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="mt-8 bg-gray-100 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 h-32 overflow-y-auto">
            <div className="space-y-3">
                {messages.map((msg, index) => (
                    <div key={index} className="animate-slideInLeft">
                        <p className="text-gray-700 dark:text-slate-300">
                            <span className="font-bold text-red-500 dark:text-red-400">{msg.author}: </span>
                            {msg.text}
                        </p>
                    </div>
                ))}
            </div>
            <div ref={chatEndRef} />
        </div>
    );
};

const AnimatedScore: React.FC<{ score: number; isAnimating: boolean }> = ({ score, isAnimating }) => {
  return (
    <p className={`font-bold text-lg transition-all duration-300 ease-in-out ${isAnimating ? 'transform scale-150 text-green-500 dark:text-green-400' : 'text-gray-800 dark:text-white'}`}>
      {score}
    </p>
  );
};


const BattleGroundPage: React.FC<BattleGroundPageProps> = ({ navigateTo, onBattleComplete, opponent, allQuestions }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [opponentName, setOpponentName] = useState('');
    const [opponentAvatar, setOpponentAvatar] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [playerScore, setPlayerScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [playerAnswer, setPlayerAnswer] = useState<number | null>(null);
    const [opponentAnswer, setOpponentAnswer] = useState<number | null>(null);
    const [isRoundOver, setIsRoundOver] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [roundResult, setRoundResult] = useState<{ player: boolean, opponent: boolean } | null>(null);


    const getRandomMessage = useCallback((category: keyof typeof OPPONENT_CHAT_MESSAGES) => {
      const messages = OPPONENT_CHAT_MESSAGES[category];
      return messages[Math.floor(Math.random() * messages.length)];
    }, []);

    const addOpponentMessage = useCallback((text: string, delay = 1000) => {
        setTimeout(() => {
            setChatMessages(prev => [...prev, { author: opponentName, text }]);
        }, delay);
    }, [opponentName]);

    useEffect(() => {
        if (!allQuestions || allQuestions.length === 0) return;
        
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        let newOpponentName;
        let newOpponentAvatar;

        if (opponent) {
            newOpponentName = opponent.name;
            newOpponentAvatar = opponent.avatarUrl;
        } else {
            newOpponentName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
            newOpponentAvatar = `https://api.dicebear.com/8.x/bottts/svg?seed=${newOpponentName}`;
        }
        
        setQuestions(shuffled.slice(0, 10)); // Battles are 10 questions
        setOpponentName(newOpponentName);
        setOpponentAvatar(newOpponentAvatar);

        setCurrentQuestionIndex(0);
        setPlayerScore(0);
        setOpponentScore(0);
        setPlayerAnswer(null);
        setOpponentAnswer(null);
        setIsRoundOver(false);
        setChatMessages([]);
        setTimeout(() => {
            setChatMessages([{ author: newOpponentName, text: getRandomMessage('greetings') }]);
        }, 1500);

    }, [allQuestions, getRandomMessage, opponent]);

    const handleNextRound = useCallback(() => {
        setRoundResult(null);
        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < questions.length) {
            setCurrentQuestionIndex(nextQuestionIndex);
            setPlayerAnswer(null);
            setOpponentAnswer(null);
            setIsRoundOver(false);
        } else {
            let finalMessage = "";
            if (playerScore > opponentScore) finalMessage = getRandomMessage('win');
            else if (opponentScore > playerScore) finalMessage = getRandomMessage('lose');
            else finalMessage = getRandomMessage('draw');
            
            addOpponentMessage(finalMessage, 500);
            
            setTimeout(() => {
                onBattleComplete(playerScore, opponentScore, questions.length, opponentName);
            }, 2000);
        }
    }, [currentQuestionIndex, questions.length, onBattleComplete, playerScore, opponentScore, opponentName, addOpponentMessage, getRandomMessage]);

    const handlePlayerAnswer = (index: number) => {
        if (playerAnswer !== null) return;
        setPlayerAnswer(index);
    };

    useEffect(() => {
        if (playerAnswer !== null && opponentAnswer === null) {
            const getOpponentResponse = async () => {
                const question = questions[currentQuestionIndex];
                if (!question) return;

                let opponentChoice: number;
                try {
                    if (isGeminiConfigured) {
                        opponentChoice = await getAiOpponentAnswer(question);
                    } else {
                        throw new Error("Gemini AI is not configured. Using fallback logic.");
                    }
                } catch (error) {
                    console.error("AI Opponent Error:", error);
                    // Fallback to the original random logic if the API call fails or is not configured.
                    const isOpponentCorrect = Math.random() > 0.25; // 75% chance to be correct
                    if (isOpponentCorrect) {
                        opponentChoice = question.correctAnswer;
                    } else {
                        const incorrectOptionIndices = Array.from(Array(question.options.length).keys())
                            .filter(i => i !== question.correctAnswer);
                        if (incorrectOptionIndices.length > 0) {
                            opponentChoice = incorrectOptionIndices[Math.floor(Math.random() * incorrectOptionIndices.length)];
                        } else {
                            opponentChoice = question.correctAnswer; 
                        }
                    }
                }
                
                setOpponentAnswer(opponentChoice);
            };

            const thinkingDelay = 500 + Math.random() * 1000;
            const timer = setTimeout(getOpponentResponse, thinkingDelay);
            return () => clearTimeout(timer);
        }
    }, [playerAnswer, opponentAnswer, currentQuestionIndex, questions]);


    useEffect(() => {
        if (playerAnswer === null || opponentAnswer === null || isRoundOver) return;

        const question = questions[currentQuestionIndex];
        const isPlayerCorrect = playerAnswer === question.correctAnswer;
        const isOpponentCorrect = opponentAnswer === question.correctAnswer;
        
        setRoundResult({ player: isPlayerCorrect, opponent: isOpponentCorrect });
        
        let newPlayerScore = playerScore;
        if(isPlayerCorrect) {
            newPlayerScore = playerScore + 1;
            setPlayerScore(newPlayerScore);
        }
        if(isOpponentCorrect) setOpponentScore(s => s + 1);

        setIsRoundOver(true);

        if (isPlayerCorrect) {
            addOpponentMessage(getRandomMessage('correctAnswer'));
        } else {
            addOpponentMessage(getRandomMessage('incorrectAnswer'));
        }

        const timer = setTimeout(handleNextRound, 2500);
        return () => clearTimeout(timer);

    }, [playerAnswer, opponentAnswer, isRoundOver, currentQuestionIndex, questions, handleNextRound, addOpponentMessage, getRandomMessage, playerScore]);

    if (questions.length === 0) {
        return <div />; 
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const progressPercentage = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    const getPlayerStatus = () => {
        if (playerAnswer === null) return "Your turn...";
        if (opponentAnswer === null) return "Opponent is thinking...";
        return "Round over!";
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-center">
                        <div className="w-1/3 flex flex-col items-center">
                            <img src="https://api.dicebear.com/8.x/initials/svg?seed=You" alt="Player" className="h-12 w-12 rounded-full border-2 border-teal-400 mb-2"/>
                            <div className="relative h-8 flex items-center justify-center">
                                <AnimatedScore score={playerScore} isAnimating={!!roundResult?.player} />
                                {roundResult?.player && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 text-green-500 dark:text-green-400 font-bold animate-popUp">+1</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">You</p>
                        </div>
                        <div className="w-1/3">
                             <p className="text-lg font-bold text-gray-900 dark:text-white">Question {currentQuestionIndex + 1}/{questions.length}</p>
                             <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">{getPlayerStatus()}</p>
                        </div>
                        <div className="w-1/3 flex flex-col items-center">
                            <img src={opponentAvatar} alt="Opponent" className={`h-12 w-12 rounded-full border-2 border-red-500 mb-2 transition-all ${playerAnswer !== null && opponentAnswer === null ? 'animate-pulse' : ''}`}/>
                            <div className="relative h-8 flex items-center justify-center">
                                <AnimatedScore score={opponentScore} isAnimating={!!roundResult?.opponent} />
                                 {roundResult?.opponent && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 text-green-500 dark:text-green-400 font-bold animate-popUp">+1</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{opponentName}</p>
                        </div>
                    </div>
                     <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-4">
                        <div className="bg-gradient-to-r from-teal-400 to-red-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                    </div>
                </div>
            </header>

            <main>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold leading-relaxed text-gray-900 dark:text-white">
                        {currentQuestion.question}
                    </h2>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => {
                        let buttonClass = 'bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-teal-500';
                         if (isRoundOver) {
                            if (index === currentQuestion.correctAnswer) {
                                buttonClass = 'bg-green-500/10 dark:bg-green-500/20 border-green-500 text-green-800 dark:text-white';
                            } else if (index === playerAnswer || index === opponentAnswer) {
                                buttonClass = 'bg-red-500/10 dark:bg-red-500/20 border-red-500 text-red-800 dark:text-white';
                            } else {
                                buttonClass = 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-60';
                            }
                        } else if (playerAnswer === index) {
                            buttonClass = 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500'
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handlePlayerAnswer(index)}
                                disabled={playerAnswer !== null}
                                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 disabled:cursor-not-allowed ${buttonClass} flex items-center`}
                            >
                                <span className="font-semibold mr-2 text-gray-900 dark:text-white">{String.fromCharCode(65 + index)}.</span>
                                {option.text && <span className="text-gray-800 dark:text-gray-300">{option.text}</span>}
                                {option.image && <img src={option.image} alt={`Option ${index + 1}`} className="h-24 rounded" />}
                            </button>
                        );
                    })}
                </div>
                <ChatBox messages={chatMessages} />
            </main>
        </div>
    );
};

export default BattleGroundPage;