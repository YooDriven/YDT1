import React, { memo } from 'react';
import { LeaderboardEntry, Page, UserProfile } from '../types';
import PerformanceChart from './PerformanceChart';
import DynamicIcon from './DynamicIcon';

interface StudentProfileCardProps {
  user: UserProfile;
  navigateTo: (page: Page) => void;
  nationalLeaderboard: LeaderboardEntry[];
  regionalLeaderboard: LeaderboardEntry[];
  handleDuel: (opponent: LeaderboardEntry) => void;
  appAssets: Record<string, string>;
}

const StudentProfileCard: React.FC<StudentProfileCardProps> = ({ user, navigateTo, nationalLeaderboard, regionalLeaderboard, handleDuel, appAssets }) => {
  const dailyGoalProgressPercent = Math.min((user.dailyGoalProgress / user.dailyGoalTarget) * 100, 100);

  const renderLeaderboard = (leaderboard: LeaderboardEntry[], title: string) => {
    const userIndex = leaderboard.findIndex(p => p.isUser);
    if (userIndex === -1) return null;

    const startIndex = Math.max(0, userIndex - 2);
    const endIndex = Math.min(leaderboard.length, userIndex + 4);
    const playersToShow = leaderboard.slice(startIndex, endIndex);

    return (
      <div className="flex-1">
        <h4 className="font-semibold text-center text-sm mb-2 text-gray-800 dark:text-gray-200">{title}</h4>
        <div className="space-y-1">
          {playersToShow.map(player => (
            <div key={`${title}-${player.rank}`} className={`flex items-center p-1.5 rounded-md ${player.isUser ? 'bg-teal-500/20 dark:bg-teal-500/20' : 'bg-gray-100 dark:bg-slate-700/50'}`}>
              <span className="text-xs font-bold w-6 text-center text-gray-500 dark:text-gray-400">{player.rank}</span>
              <img src={player.avatarUrl} alt={player.name} className="h-6 w-6 rounded-full mx-1.5"/>
              <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{player.name}</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white mr-2">{player.score}%</span>
              {!player.isUser && (
                <button onClick={() => handleDuel(player)} className="p-1 rounded-md bg-red-500/10 dark:bg-red-500/20 text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors">
                  <DynamicIcon svgString={appAssets['icon_swords']} className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
            <img
            src={user.avatarUrl}
            alt="Student Profile"
            className="h-16 w-16 rounded-full border-2 border-teal-400"
            />
            <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Keep up the great work!</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
        {/* Daily Goal */}
        <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 aspect-square">
            <div className="relative h-10 w-10">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-gray-200 dark:text-slate-600" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={dailyGoalProgressPercent >= 100 ? "#2dd4bf" : "#f59e0b"} strokeWidth="4" strokeDasharray={`${dailyGoalProgressPercent}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{`${Math.round(dailyGoalProgressPercent)}%`}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">Daily Goal</p>
        </div>

        {/* Avg. Score */}
        <div className="relative group flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 aspect-square">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{`${user.avgScore}%`}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">Avg. Score</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto z-20">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center text-left">
                  <DynamicIcon svgString={appAssets['icon_chart_bar']} className="h-5 w-5 mr-2" />
                  Topic Performance
              </h3>
              <PerformanceChart attempts={user.testHistory} />
            </div>
        </div>
        
        {/* Tests Taken */}
        <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 aspect-square">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.testsTaken}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">Tests Taken</p>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 aspect-square">
            <DynamicIcon svgString={appAssets['badge_fire']} className="h-6 w-6 text-orange-400" />
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{user.streak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Streak</p>
        </div>

        {/* Freezes */}
        <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 aspect-square">
            <DynamicIcon svgString={appAssets['badge_snowflake']} className="h-6 w-6 text-sky-400" />
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{user.freezes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Freezes</p>
        </div>
      </div>
      
      <div className="flex-grow space-y-4">          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <DynamicIcon svgString={appAssets['badge_generic']} className="h-5 w-5 mr-2" />
                Badges
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {user.badges.map((badge) => {
                    return (
                        <div key={badge.name} className="flex items-center bg-gray-100 dark:bg-slate-700/50 p-1 rounded-md">
                            <DynamicIcon svgString={appAssets[badge.icon]} className={`h-4 w-4 mr-1.5 ${badge.color}`} />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-tight">{badge.name}</span>
                        </div>
                    );
                })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <DynamicIcon svgString={appAssets['badge_trophy']} className="h-5 w-5 mr-2" />
                Leaderboard
            </h3>
            <div className="flex gap-4">
              {renderLeaderboard(nationalLeaderboard, "National")}
              {renderLeaderboard(regionalLeaderboard, "Regional")}
            </div>
          </div>
      </div>
      <div className="mt-6">
        <button
          onClick={() => navigateTo(Page.StudyHub)}
          className="w-full text-center bg-[#008485] text-white font-bold py-3 rounded-lg hover:bg-[#007374] transition-colors"
        >
          Study Hub
        </button>
      </div>
    </div>
  );
};

export default memo(StudentProfileCard);
