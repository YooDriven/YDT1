import React from 'react';
import { Page } from '../types';
import { Button } from './ui';

interface BattleResultsPageProps {
  navigateTo: (page: Page) => void;
  onRematch: () => void;
  playerScore: number;
  opponentScore: number;
  total: number;
  opponentName: string;
}

const BattleResultsPage: React.FC<BattleResultsPageProps> = ({ navigateTo, onRematch, playerScore, opponentScore, total, opponentName }) => {
    const getResult = () => {
        if (playerScore > opponentScore) return { text: "You Win!", color: "text-teal-500 dark:text-teal-400" };
        if (playerScore < opponentScore) return { text: "You Lose", color: "text-red-500" };
        return { text: "It's a Draw!", color: "text-gray-600 dark:text-gray-300" };
    };

    const result = getResult();

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800/50 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 animate-fadeInUp shadow-2xl shadow-gray-200/50 dark:shadow-none">
        <h1 className={`text-5xl font-bold ${result.color} tracking-tight animate-scaleIn`}>
          {result.text}
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">Final Score</p>
        
        <div className="flex justify-around items-center my-8">
            <div className="text-center">
                <p className="text-5xl font-bold text-teal-500 dark:text-teal-400">{playerScore}<span className="text-3xl text-gray-400">/{total}</span></p>
                <p className="text-base text-gray-500 dark:text-gray-400 mt-2">You</p>
            </div>
            <div className="text-center">
                <p className="text-5xl font-bold text-red-500">{opponentScore}<span className="text-3xl text-gray-400">/{total}</span></p>
                <p className="text-base text-gray-500 dark:text-gray-400 mt-2">{opponentName}</p>
            </div>
        </div>
        
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            {playerScore > opponentScore 
                ? `Excellent driving! You left ${opponentName} in the dust. Ready for another challenge?`
                : playerScore < opponentScore 
                    ? `A tough race! ${opponentName} got the better of you this time. Shake it off and go for a rematch.`
                    : "An intense match right to the end! You and your opponent were perfectly matched."
            }
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={onRematch} variant="primary">
                Rematch
            </Button>
            <Button onClick={() => navigateTo(Page.Matchmaking)} variant="secondary">
                New Opponent
            </Button>
            <Button onClick={() => navigateTo(Page.Dashboard)} variant="outline">
                Dashboard
            </Button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultsPage;
