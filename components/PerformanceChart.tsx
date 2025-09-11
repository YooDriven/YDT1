import React, { useMemo } from 'react';
import { TestAttempt } from '../types';
import { PASS_PERCENTAGE } from '../constants';

interface PerformanceChartProps {
    attempts: TestAttempt[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ attempts }) => {
    const performanceData = useMemo(() => {
        const topicStats: { [key: string]: { scores: number[], totals: number[] } } = {};

        attempts.forEach(attempt => {
            if (!topicStats[attempt.topic]) {
                topicStats[attempt.topic] = { scores: [], totals: [] };
            }
            topicStats[attempt.topic].scores.push(attempt.score);
            topicStats[attempt.topic].totals.push(attempt.total);
        });

        const topicAverages = Object.entries(topicStats).map(([topic, data]) => {
            const totalScore = data.scores.reduce((sum, score) => sum + score, 0);
            const totalPossible = data.totals.reduce((sum, total) => sum + total, 0);
            const average = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
            return { topic, average: Math.round(average) };
        });

        return topicAverages.sort((a, b) => b.average - a.average);
    }, [attempts]);

    if (performanceData.length === 0) {
        return (
            <div className="bg-gray-200 dark:bg-slate-700/50 p-4 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No topic test history found. Complete some topic tests to see your performance breakdown!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {performanceData.map(({ topic, average }, index) => {
                const isPassing = average >= PASS_PERCENTAGE;
                const barColor = isPassing ? 'bg-teal-500' : 'bg-yellow-500';

                return (
                    <div key={topic} className="stagger-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate pr-2">{topic}</p>
                            <p className={`text-xs font-bold ${isPassing ? 'text-teal-500 dark:text-teal-400' : 'text-yellow-500'}`}>{average}%</p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                                className={`${barColor} h-2 rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${average}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PerformanceChart;