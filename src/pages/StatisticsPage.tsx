import React, { useMemo } from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from '../components/icons';
import { useApp } from '../contexts/AppContext';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StatisticsPage: React.FC = () => {
    const { navigateTo } = useApp();
    const { userProfile } = useGlobalState();

    const testHistory = userProfile?.testHistory || [];

    const scoreTrendData = useMemo(() => {
        return testHistory
            .slice() // Create a copy to avoid mutating the original
            .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
            .map((attempt, index) => ({
                name: `Test ${index + 1}`,
                score: Math.round((attempt.score / attempt.total) * 100),
            }));
    }, [testHistory]);
    
    const topicPerformanceData = useMemo(() => {
        const topicStats: { [key: string]: { scores: number[], totals: number[] } } = {};
        testHistory.forEach(attempt => {
            if (!topicStats[attempt.topic]) topicStats[attempt.topic] = { scores: [], totals: [] };
            topicStats[attempt.topic].scores.push(attempt.score);
            topicStats[attempt.topic].totals.push(attempt.total);
        });

        return Object.entries(topicStats).map(([topic, data]) => {
            const totalScore = data.scores.reduce((sum, score) => sum + score, 0);
            const totalPossible = data.totals.reduce((sum, total) => sum + total, 0);
            return {
                topic,
                average: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
            };
        }).sort((a, b) => b.average - a.average);
    }, [testHistory]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.Profile)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span className="text-base">Back to Profile</span>
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Your Statistics</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    Analyze your performance and identify areas for improvement.
                </p>
            </header>

            <main className="space-y-8">
                {testHistory.length > 0 ? (
                    <>
                        <section className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Score Trend</h2>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={scoreTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                        <XAxis dataKey="name" stroke="rgb(100 116 139)" />
                                        <YAxis domain={[0, 100]} stroke="rgb(100 116 139)" />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Topic Performance</h2>
                             <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={topicPerformanceData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                        <XAxis type="number" domain={[0, 100]} stroke="rgb(100 116 139)" />
                                        <YAxis type="category" dataKey="topic" width={150} stroke="rgb(100 116 139)" />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155' }} />
                                        <Bar dataKey="average" fill="#14b8a6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </>
                ) : (
                     <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No Statistics Yet</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Complete some tests to see your performance data here.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StatisticsPage;
