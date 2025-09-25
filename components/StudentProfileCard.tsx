import React, { memo } from 'react';
import { LeaderboardEntry, Page } from '../types';
import PerformanceChart from './PerformanceChart';
import DynamicAsset from './DynamicAsset';
import { Button, Skeleton } from './ui';
import { useAuth } from '../contexts/AuthContext';
// FIX: Replace `useAppContext` with the correct `useApp` hook.
import { useApp } from '../contexts/AppContext';
import { useGameplay } from '../contexts/GameplayContext';

interface StudentProfileCardProps {
  loading: boolean;
  nationalLeaderboard: LeaderboardEntry[];
  regionalLeaderboard: LeaderboardEntry[];
}

const StudentProfileCard: React.FC<StudentProfileCardProps> = ({ loading, nationalLeaderboard, regionalLeaderboard }) => {
  const { userProfile: user } = useAuth();
  const { navigateTo, appAssets } = useApp();
  const { handleDuel } = useGameplay();
  
  if (loading || !user) {
    return (
        <div className="space-y-4 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 h-full">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  const dailyGoalProgressPercent = Math.min((user.dailyGoalProgress / user.dailyGoalTarget) * 100, 100);

  const renderLeaderboard = (leaderboard: LeaderboardEntry[], title: string) => {
    const playersToShow = leaderboard.slice(0, 5);

    return (
      <div className="flex-1">
        <h4 className="font-semibold text-center text-sm mb-2 text-gray-800 dark:text-gray-200">{title}</h4>
        <div className="space-y-1.5">
          {playersToShow.map(player => (
            <div key={`${title}-${player.rank}`} className={`flex items-center p-1.5 rounded-lg ${player.isUser ? 'bg-teal-500/20' : 'bg-gray-100 dark:bg-slate-700/50'}`}>
              <span className="text-xs font-bold w-6 text-center text-gray-500 dark:text-gray-400">{player.rank}</span>
              <img src={player.avatarUrl} alt={player.name} className="h-6 w-6 rounded-full mx-1.5"/>
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{player.name}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white mr-2">{player.score}%</span>
              {!player.isUser && (
                <button onClick={() => handleDuel(player)} className="p-1 rounded-md bg-red-500/10 dark:bg-red-500/20 text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors">
                  <DynamicAsset asset={appAssets['icon_swords']} className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 h-full flex flex-col shadow-lg shadow-gray-200/50 dark:shadow-black/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
            <img
            src={user.avatarUrl}
            alt="Student Profile"
            className="h-16 w-16 rounded-full border-4 border-white dark:border-slate-700 shadow-md"
            />
            <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{user.name}</h2>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-snug">Keep up the great work!</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50">
            <div className="relative h-10 w-10">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-gray-200 dark:text-slate-600" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className={`${dailyGoalProgressPercent >= 100 ? "text-teal-500" : "text-amber-500"}`} strokeWidth="4" strokeDasharray={`${dailyGoalProgressPercent}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <DynamicAsset asset={appAssets['icon_calendar']} className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-tight">{`${Math.round(dailyGoalProgressPercent)}% Daily`}</p>
        </div>

        <div className="relative group flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.testsTaken > 0 ? `${user.avgScore}%` : 'N/A'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">Avg. Score</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto z-20">
              <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center text-left">
                  <DynamicAsset asset={appAssets['icon_chart_bar']} className="h-5 w-5 mr-2" />
                  Topic Performance
              </h3>
              <PerformanceChart attempts={user.testHistory} />
            </div>
        </div>
        
        <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.testsTaken}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">Tests</p>
        </div>
      </div>
       <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center justify-center text-center p-2 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
              <DynamicAsset asset={appAssets['badge_fire']} className="h-6 w-6 text-orange-400" />
              <p className="text-xl font-bold text-gray-900 dark:text-white ml-2">{user.streak}</p>
              <p className="text-sm text-orange-500 dark:text-orange-400 ml-1.5">Streak</p>
          </div>
          <div className="flex items-center justify-center text-center p-2 rounded-lg bg-sky-500/10 dark:bg-sky-500/20">
              <DynamicAsset asset={appAssets['badge_snowflake']} className="h-6 w-6 text-sky-400" />
              <p className="text-xl font-bold text-gray-900 dark:text-white ml-2">{user.freezes}</p>
              <p className="text-sm text-sky-500 dark:text-sky-400 ml-1.5">Freezes</p>
          </div>
       </div>
      
      <div className="flex-grow space-y-4">          
          <div>
            <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <DynamicAsset asset={appAssets['badge_generic']} className="h-5 w-5 mr-2" />
                Badges
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {user.badges.map((badge) => {
                    return (
                        <div key={badge.name} className="flex items-center bg-gray-100 dark:bg-slate-700/50 p-1.5 rounded-lg">
                            <DynamicAsset asset={appAssets[badge.icon]} className={`h-4 w-4 mr-1.5 ${badge.color}`} />
                            <span className="text-sm font-normal text-gray-600 dark:text-gray-300 leading-tight">{badge.name}</span>
                        </div>
                    );
                })}
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <DynamicAsset asset={appAssets['badge_trophy']} className="h-5 w-5 mr-2" />
                Leaderboard
            </h3>
            <div className="flex gap-4">
              {renderLeaderboard(nationalLeaderboard, "National")}
              {renderLeaderboard(regionalLeaderboard, "Regional")}
            </div>
             <Button
                onClick={() => navigateTo(Page.Leaderboard)}
                variant="outline"
                className="w-full mt-3 !py-1.5 text-xs"
            >
                View Full Leaderboard
            </Button>
          </div>
      </div>
      <div className="mt-6">
        <Button
          onClick={() => navigateTo(Page.StudyHub)}
          variant="primary"
          className="w-full !py-3 !text-base"
        >
          Go to Study Hub
        </Button>
      </div>
    </div>
  );
};

export default memo(StudentProfileCard);