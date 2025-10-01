
import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from './icons';
import { Button, Skeleton } from './ui';
import { useApp } from '../contexts/AppContext';
import { useGlobalState } from '../contexts/GlobalStateContext';

interface LeaderboardPlayer {
    id: string;
    name: string;
    avatarUrl: string;
    avgScore: number;
}

const PAGE_SIZE = 20;

const LeaderboardPage: React.FC = () => {
    const { navigateTo, supabase } = useApp();
    const { userProfile } = useGlobalState();
    const currentUser = userProfile!;

    const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            setError(null);
            
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name, avatarUrl, avgScore')
                    .order('avgScore', { ascending: false })
                    .range(from, to);

                if (error) throw error;

                if (data) {
                    setPlayers(data.map(p => ({ ...p, avatarUrl: p.avatarUrl, avgScore: p.avgScore })));
                    setHasMore(data.length === PAGE_SIZE);
                } else {
                    setHasMore(false);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, [page, supabase]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.Dashboard)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span className="text-base">Back to Dashboard</span>
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Global Leaderboard</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">See how you rank against other drivers.</p>
            </header>

            <main>
                <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 tracking-wider">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-center w-16">Rank</th>
                                    <th scope="col" className="px-6 py-3">Player</th>
                                    <th scope="col" className="px-6 py-3 text-right">Avg. Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b dark:border-slate-700">
                                        <td className="px-6 py-3 text-center"><Skeleton className="h-6 w-6 mx-auto" /></td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center space-x-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right"><Skeleton className="h-6 w-12 ml-auto" /></td>
                                    </tr>
                                ))}
                                {error && (
                                     <tr>
                                        <td colSpan={3} className="text-center p-8 text-red-500">Error: {error}</td>
                                    </tr>
                                )}
                                {!loading && !error && players.map((player, index) => {
                                    const isCurrentUser = player.id === currentUser.id;
                                    const rank = page * PAGE_SIZE + index + 1;
                                    return (
                                        <tr key={player.id} className={`border-b dark:border-slate-700 ${isCurrentUser ? 'bg-teal-500/10' : ''}`}>
                                            <td className="px-6 py-3 text-center font-bold text-lg text-gray-800 dark:text-white">{rank}</td>
                                            <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">
                                                <div className="flex items-center space-x-3">
                                                    <img src={player.avatarUrl} alt={player.name} className="h-10 w-10 rounded-full" />
                                                    <span>{player.name}</span>
                                                    {isCurrentUser && <span className="text-xs font-bold text-white bg-teal-500 px-2 py-0.5 rounded-full">You</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-lg text-gray-800 dark:text-white">{player.avgScore}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                    <Button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        variant="secondary"
                    >
                        Previous
                    </Button>
                    <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Page {page + 1}</span>
                     <Button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore || loading}
                        variant="secondary"
                    >
                        Next
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default LeaderboardPage;
