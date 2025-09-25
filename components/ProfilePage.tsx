import React from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from './icons';
import DynamicAsset from './DynamicAsset';
import { useAppContext } from '../contexts/AppContext';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg flex items-center">
        <div className="mr-4 text-gray-500 dark:text-gray-400">{icon}</div>
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const ProfilePage: React.FC = () => {
    const { userProfile, navigateTo, appAssets } = useAppContext();
    const user = userProfile!;

    const navigationItems = [
        { page: Page.Friends, label: 'Friends', icon: 'icon_swords' },
        { page: Page.Achievements, label: 'Achievements', icon: 'badge_trophy' },
        { page: Page.Statistics, label: 'Statistics', icon: 'icon_chart_bar' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center space-x-4">
                    <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-full border-4 border-teal-400" />
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{user.name}</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">Here's your progress summary.</p>
                    </div>
                </div>
            </header>

            <main className="space-y-8">
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {navigationItems.map(item => (
                         <button
                            key={item.page}
                            onClick={() => navigateTo(item.page)}
                            className="p-4 bg-white dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 transition-all transform hover:-translate-y-1"
                        >
                            <DynamicAsset asset={appAssets[item.icon]} className="h-8 w-8 text-gray-500 dark:text-gray-400 mb-2" />
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{item.label}</span>
                        </button>
                    ))}
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={<DynamicAsset asset={appAssets['icon_chart_bar']} className="h-8 w-8" />} label="Avg. Score" value={user.testsTaken > 0 ? `${user.avgScore}%` : 'N/A'} />
                        <StatCard icon={<DynamicAsset asset={appAssets['badge_trophy']} className="h-8 w-8" />} label="Tests Taken" value={user.testsTaken} />
                        <StatCard icon={<DynamicAsset asset={appAssets['badge_fire']} className="h-8 w-8 text-orange-400" />} label="Streak" value={user.streak} />
                        <StatCard icon={<DynamicAsset asset={appAssets['badge_snowflake']} className="h-8 w-8 text-sky-400" />} label="Freezes" value={user.freezes} />
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">Battle History</h2>
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Opponent</th>
                                        <th scope="col" className="px-6 py-3">Result</th>
                                        <th scope="col" className="px-6 py-3">Score</th>
                                        <th scope="col" className="px-6 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.battleHistory?.length > 0 ? (
                                        user.battleHistory.map((battle, index) => {
                                            const isWin = battle.user_score > battle.opponent_score;
                                            const isDraw = battle.user_score === battle.opponent_score;
                                            return (
                                                <tr key={index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <img src={battle.opponent_avatar_url} alt={battle.opponent_name} className="h-8 w-8 rounded-full" />
                                                            <span className="font-semibold text-gray-900 dark:text-white">{battle.opponent_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 font-semibold ${isWin ? 'text-teal-500' : isDraw ? 'text-gray-500' : 'text-red-500'}`}>
                                                        {isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'}
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{battle.user_score} - {battle.opponent_score}</td>
                                                    <td className="px-6 py-4">{new Date(battle.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center p-8">No battle history yet. Go challenge someone!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">Test History</h2>
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Topic</th>
                                        <th scope="col" className="px-6 py-3">Score</th>
                                        <th scope="col" className="px-6 py-3">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.testHistory?.length > 0 ? (
                                        user.testHistory.slice().reverse().map((attempt, index) => {
                                            const percentage = Math.round((attempt.score / attempt.total) * 100);
                                            return (
                                                <tr key={index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                                    <th scope="row" className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap dark:text-white">
                                                        {attempt.topic}
                                                    </th>
                                                    <td className="px-6 py-4">{attempt.score}/{attempt.total}</td>
                                                    <td className="px-6 py-4 font-semibold">{percentage}%</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center p-8">No test history yet. Complete a test to see your results here.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ProfilePage;