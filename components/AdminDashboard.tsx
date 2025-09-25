import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserGrowthData, FailedQuestionData, TopicPopularityData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Skeleton } from './ui';

const StatCard: React.FC<{ title: string; value: string | number; isLoading: boolean }> = ({ title, value, isLoading }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {isLoading ? <Skeleton className="h-8 w-1/2 mt-1" /> : <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>}
    </div>
);

const AdminDashboard: React.FC<{ showToast: (msg: string, type?: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [dau, setDau] = useState<number | null>(null);
    const [mau, setMau] = useState<number | null>(null);
    const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
    const [failedQuestions, setFailedQuestions] = useState<FailedQuestionData[]>([]);
    const [topicPopularity, setTopicPopularity] = useState<TopicPopularityData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [dauRes, mauRes, growthRes, failedRes, popularityRes] = await Promise.all([
                    supabase!.rpc('get_dau'),
                    supabase!.rpc('get_mau'),
                    supabase!.rpc('get_daily_user_growth'),
                    supabase!.rpc('get_most_failed_questions'),
                    supabase!.rpc('get_topic_popularity')
                ]);

                if (dauRes.error) throw new Error(`DAU Error: ${dauRes.error.message}`);
                setDau(dauRes.data[0].dau_count);

                if (mauRes.error) throw new Error(`MAU Error: ${mauRes.error.message}`);
                setMau(mauRes.data[0].mau_count);

                if (growthRes.error) throw new Error(`Growth Error: ${growthRes.error.message}`);
                setUserGrowth(growthRes.data);

                if (failedRes.error) throw new Error(`Failed Q's Error: ${failedRes.error.message}`);
                setFailedQuestions(failedRes.data);

                if (popularityRes.error) throw new Error(`Popularity Error: ${popularityRes.error.message}`);
                setTopicPopularity(popularityRes.data);

            } catch (error: any) {
                showToast(error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [showToast]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Daily Active Users" value={dau ?? 'N/A'} isLoading={loading} />
                <StatCard title="Monthly Active Users" value={mau ?? 'N/A'} isLoading={loading} />
                <StatCard title="Total Users" value={userGrowth.length > 0 ? userGrowth[userGrowth.length - 1].count : 'N/A'} isLoading={loading} />
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Growth (Last 30 Days)</h2>
                {loading ? <Skeleton className="h-72 w-full" /> : (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="date" stroke="rgb(100 116 139)" />
                                <YAxis stroke="rgb(100 116 139)" allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155' }} />
                                <Line type="monotone" dataKey="count" name="Total Users" stroke="#14b8a6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Most Failed Questions</h2>
                    {loading ? <Skeleton className="h-72 w-full" /> : (
                        <ul className="space-y-2">
                           {failedQuestions.map(q => (
                               <li key={q.question} className="text-sm text-gray-600 dark:text-gray-300">
                                   <span className="font-semibold text-red-500">{q.fail_count} fails</span> - <span className="truncate">{q.question}</span>
                                </li>
                           ))}
                        </ul>
                    )}
                </div>
                 <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Topic Popularity</h2>
                    {loading ? <Skeleton className="h-72 w-full" /> : (
                         <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={topicPopularity} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis type="number" stroke="rgb(100 116 139)" />
                                    <YAxis type="category" dataKey="topic" stroke="rgb(100 116 139)" width={150} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155' }} />
                                    <Bar dataKey="count" name="Tests Taken" fill="#14b8a6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;