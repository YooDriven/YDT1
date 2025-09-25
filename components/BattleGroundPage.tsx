import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Question, ChatMessage, Opponent, UserProfile } from '../types';
import { OPPONENT_CHAT_MESSAGES } from '../constants';
import { useQuestions } from '../contexts/QuestionsContext';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from 'https://esm.sh/@supabase/supabase-js@2';

interface BattleGroundPageProps {
  navigateTo: (page: Page) => void;
  onBattleComplete: (playerScore: number, opponentScore: number, total: number, opponent: Opponent) => void;
  battleId: string;
  user: UserProfile;
  opponent: Opponent;
}

const opponentNames = ["RoadRunner", "DriftKing", "CaptainClutch", "SpeedyGonzales"];

const getBotAnswer = (question: Question): number => {
    const isOpponentCorrect = Math.random() > 0.25; // 75% chance to be correct
    if (isOpponentCorrect) {
        return question.correctAnswer;
    }
    const incorrectOptions = Array.from({ length: question.options.length }, (_, i) => i).filter(i => i !== question.correctAnswer);
    return incorrectOptions.length > 0 ? incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)] : question.correctAnswer;
};

const ChatBox: React.FC<{ messages: ChatMessage[]; author: string }> = ({ messages, author }) => {
    const chatEndRef = useRef<null | HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="mt-8 bg-gray-100 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 h-32 overflow-y-auto">
            <div className="space-y-3">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.author === author ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-lg ${msg.author === author ? 'bg-white dark:bg-slate-700 rounded-bl-none' : 'bg-teal-500 text-white rounded-br-none'}`}>
                            <p className="text-sm leading-snug">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div ref={chatEndRef} />
        </div>
    );
};

const AnimatedScore: React.FC<{ score: number; isAnimating: boolean }> = ({ score, isAnimating }) => {
  return (
    <p className={`font-bold text-3xl transition-all duration-300 ease-in-out ${isAnimating ? 'transform scale-150 text-green-500 dark:text-green-400' : 'text-gray-800 dark:text-white'}`}>
      {score}
    </p>
  );
};

const BattleGroundPage: React.FC<BattleGroundPageProps> = ({ navigateTo, onBattleComplete, battleId, user, opponent }) => {
    const { questions: allQuestions, loading: questionsLoading } = useQuestions();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [opponentDetails, setOpponentDetails] = useState<Opponent>(opponent);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [playerScore, setPlayerScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [playerAnswer, setPlayerAnswer] = useState<number | null>(null);
    const [opponentAnswer, setOpponentAnswer] = useState<number | null>(null);
    const [isRoundOver, setIsRoundOver] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [roundResult, setRoundResult] = useState<{ player: boolean, opponent: boolean } | null>(null);
    const [statusText, setStatusText] = useState("Loading battle...");

    const channelRef = useRef<RealtimeChannel | null>(null);
    const isHost = !opponent.isBot && user.id < (opponent.id || '');

    const getRandomMessage = useCallback((category: keyof typeof OPPONENT_CHAT_MESSAGES) => {
      const messages = OPPONENT_CHAT_MESSAGES[category];
      return messages[Math.floor(Math.random() * messages.length)];
    }, []);

    const addOpponentMessage = useCallback((text: string, delay = 1000) => {
        setTimeout(() => {
            setChatMessages(prev => [...prev, { author: opponentDetails.name, text }]);
        }, delay);
    }, [opponentDetails.name]);

    const handleNextRound = useCallback(() => {
        setRoundResult(null);
        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < questions.length) {
            setCurrentQuestionIndex(nextQuestionIndex);
            setPlayerAnswer(null);
            setOpponentAnswer(null);
            setIsRoundOver(false);
            setStatusText("Your turn...");
        } else {
            if (opponent.isBot) {
                let finalMessage = "";
                if (playerScore > opponentScore) finalMessage = getRandomMessage('win');
                else if (opponentScore > playerScore) finalMessage = getRandomMessage('lose');
                else finalMessage = getRandomMessage('draw');
                addOpponentMessage(finalMessage, 500);
            }
            setTimeout(() => {
                onBattleComplete(playerScore, opponentScore, questions.length, opponentDetails);
            }, 2000);
        }
    }, [currentQuestionIndex, questions.length, onBattleComplete, playerScore, opponentScore, opponentDetails, addOpponentMessage, getRandomMessage, opponent.isBot]);

    useEffect(() => {
        setOpponentDetails(opponent);
        if (questionsLoading || allQuestions.length === 0) return;

        if (opponent.isBot) {
            const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
            setQuestions(shuffled.slice(0, 10));
            setStatusText("Your turn...");
            addOpponentMessage(getRandomMessage('greetings'));
        } else {
             const channel = supabase!.channel(battleId, { config: { presence: { key: user.id } } });
             channelRef.current = channel;

             channel.on('presence', { event: 'join' }, ({ newPresences }) => {
                 const opponentPresence = newPresences.find(p => p.user_id !== user.id);
                 if (opponentPresence) {
                     setOpponentDetails(prev => ({ ...prev, name: opponentPresence.name, avatarUrl: opponentPresence.avatar_url }));
                 }
             });

             channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
                 const opponentLeft = leftPresences.some(p => p.user_id === opponent.id);
                 if (opponentLeft) {
                    onBattleComplete(playerScore, opponentScore, questions.length, { ...opponentDetails, name: `${opponentDetails.name} (Forfeited)` });
                 }
             });

             channel.on('broadcast', { event: 'questions' }, ({ payload }) => {
                 const questionIds = payload.questionIds;
                 const questionMap = new Map(allQuestions.map(q => [q.id, q]));
                 const battleQuestions = questionIds.map((id: string) => questionMap.get(id)).filter(Boolean) as Question[];
                 setQuestions(battleQuestions);
                 setStatusText("Your turn...");
             });

             channel.on('broadcast', { event: 'answer' }, ({ payload }) => {
                 if (payload.userId !== user.id) {
                     setOpponentAnswer(payload.answerIndex);
                 }
             });

             channel.subscribe(async (status) => {
                 if (status === 'SUBSCRIBED') {
                     await channel.track({ user_id: user.id, name: user.name, avatar_url: user.avatarUrl });
                     if (isHost) {
                         const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
                         const battleQuestions = shuffled.slice(0, 10);
                         setQuestions(battleQuestions);
                         channel.send({ type: 'broadcast', event: 'questions', payload: { questionIds: battleQuestions.map(q => q.id) } });
                         setStatusText("Your turn...");
                     }
                 }
             });
        }

        return () => {
            if (channelRef.current) {
                supabase?.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [allQuestions, questionsLoading, opponent, battleId, user, isHost]);

    const handlePlayerAnswer = (index: number) => {
        if (playerAnswer !== null) return;
        setPlayerAnswer(index);
        setStatusText(opponentAnswer === null ? "Opponent is thinking..." : "Round over!");

        if (!opponent.isBot && channelRef.current) {
            channelRef.current.send({ type: 'broadcast', event: 'answer', payload: { userId: user.id, answerIndex: index } });
        }
    };

    useEffect(() => {
        if (playerAnswer !== null && opponentAnswer === null && opponent.isBot) {
            const question = questions[currentQuestionIndex];
            if (!question) return;
            const thinkingDelay = 500 + Math.random() * 1000;
            const timer = setTimeout(() => setOpponentAnswer(getBotAnswer(question)), thinkingDelay);
            return () => clearTimeout(timer);
        }
    }, [playerAnswer, opponentAnswer, currentQuestionIndex, questions, opponent.isBot]);

    useEffect(() => {
        if (playerAnswer !== null && opponentAnswer !== null && !isRoundOver) {
            setStatusText("Round over!");
            const question = questions[currentQuestionIndex];
            const isPlayerCorrect = playerAnswer === question.correctAnswer;
            const isOpponentCorrect = opponentAnswer === question.correctAnswer;
            
            setRoundResult({ player: isPlayerCorrect, opponent: isOpponentCorrect });
            
            if(isPlayerCorrect) setPlayerScore(s => s + 1);
            if(isOpponentCorrect) setOpponentScore(s => s + 1);

            setIsRoundOver(true);

            if (opponent.isBot) {
                if (isPlayerCorrect) addOpponentMessage(getRandomMessage('correctAnswer'));
                else addOpponentMessage(getRandomMessage('incorrectAnswer'));
            }

            const timer = setTimeout(handleNextRound, 2500);
            return () => clearTimeout(timer);
        }
    }, [playerAnswer, opponentAnswer, isRoundOver, currentQuestionIndex, questions, handleNextRound, addOpponentMessage, getRandomMessage, opponent.isBot]);

    if (questionsLoading || questions.length === 0) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">{statusText}</div>; 
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const progressPercentage = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="relative flex justify-center items-center text-center">
                    <div className="w-1/2 bg-teal-500/10 dark:bg-teal-500/20 p-4 rounded-l-xl flex items-center justify-start gap-4">
                        <img src={user.avatarUrl} alt="Player" className="h-12 w-12 rounded-full border-2 border-teal-400"/>
                        <div>
                             <p className="text-sm text-gray-500 dark:text-gray-400 text-left">{user.name}</p>
                             <div className="relative h-8 flex items-center justify-center">
                                <AnimatedScore score={playerScore} isAnimating={!!roundResult?.player} />
                                {roundResult?.player && (
                                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-green-500 dark:text-green-400 font-bold animate-popUp">+1</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2 bg-red-500/10 dark:bg-red-500/20 p-4 rounded-r-xl flex items-center justify-end text-right gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{opponentDetails.name}</p>
                            <div className="relative h-8 flex items-center justify-center">
                                <AnimatedScore score={opponentScore} isAnimating={!!roundResult?.opponent} />
                                 {roundResult?.opponent && (
                                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-green-500 dark:text-green-400 font-bold animate-popUp">+1</span>
                                )}
                            </div>
                        </div>
                        <img src={opponentDetails.avatarUrl} alt="Opponent" className={`h-12 w-12 rounded-full border-2 border-red-500 transition-all ${playerAnswer !== null && opponentAnswer === null ? 'animate-pulse' : ''}`}/>
                    </div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-full p-2 border border-gray-200 dark:border-slate-700 w-36 shadow-lg">
                         <p className="text-sm font-semibold text-gray-900 dark:text-white">Q {currentQuestionIndex + 1}/{questions.length}</p>
                         <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold">{statusText}</p>
                    </div>
                </div>
                 <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-4">
                    <div className="bg-gradient-to-r from-teal-400 to-red-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                </div>
            </header>

            <main>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-semibold leading-tight text-gray-900 dark:text-white">
                        {currentQuestion.question}
                    </h2>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => {
                        let buttonClass = 'bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-teal-500';
                         if (isRoundOver) {
                            if (index === currentQuestion.correctAnswer) {
                                buttonClass = 'bg-green-500/10 dark:bg-green-500/20 border-green-500 text-green-800 dark:text-white ring-2 ring-green-500';
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
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 disabled:cursor-not-allowed ${buttonClass} flex items-center`}
                            >
                                <span className="font-semibold mr-3 text-gray-900 dark:text-white">{String.fromCharCode(65 + index)}.</span>
                                {option.text && <span className="text-base text-gray-800 dark:text-gray-300 leading-snug">{option.text}</span>}
                                {option.image && <img src={option.image} alt={`Option ${index + 1}`} className="h-24 rounded" />}
                            </button>
                        );
                    })}
                </div>
                {opponent.isBot && <ChatBox messages={chatMessages} author={opponentDetails.name} />}
            </main>
        </div>
    );
};

export default BattleGroundPage;