import React from 'react';
import { Page, UserProfile } from '../types';
import { ChevronLeftIcon, FireIcon, SnowflakeIcon, TrophyIcon, BadgeIcon, ChartBarIcon } from './icons';

interface ProfilePageProps {
    user: UserProfile;
    navigateTo: (page: Page) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg flex items-center">
        <div className="mr-4 text-gray-500 dark:text-gray-400">{icon}</div>
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ user, navigateTo }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.Dashboard)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
                <div className="flex items-center space-x-4">
                    <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-full border-4 border-teal-400" />
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400">Here's your progress summary.</p>
                    </div>
                </div>
            </header>

            <main className="space-y-8">
                {/* Stats Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={<ChartBarIcon className="h-8 w-8" />} label="Avg. Score" value={`${user.avgScore}%`} />
                        <StatCard icon={<TrophyIcon className="h-8 w-8" />} label="Tests Taken" value={user.testsTaken} />
                        <StatCard icon={<FireIcon className="h-8 w-8 text-orange-400" />} label="Streak" value={user.streak} />
                        <StatCard icon={<SnowflakeIcon className="h-8 w-8 text-sky-400" />} label="Freezes" value={user.freezes} />
                    </div>
                </section>

                {/* Badges Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Badges</h2>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {user.badges.map((badge, index) => {
                            const Icon = badge.icon;
                            return (
                                <div key={index} className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg text-center">
                                    <Icon className={`h-10 w-10 mx-auto ${badge.color}`} />
                                    <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{badge.name}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Test History Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Test History</h2>
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Topic</th>
                                        <th scope="col" className="px-6 py-3">Score</th>
                                        <th scope="col" className="px-6 py-3">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.testHistory.slice().reverse().map((attempt, index) => {
                                        const percentage = Math.round((attempt.score / attempt.total) * 100);
                                        return (
                                            <tr key={index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {attempt.topic}
                                                </th>
                                                <td className="px-6 py-4">{attempt.score}/{attempt.total}</td>
                                                <td className="px-6 py-4">{percentage}%</td>
                                            </tr>
                                        );
                                    })}
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