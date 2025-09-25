import React from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from '../components/icons';
import { useAppContext } from '../contexts/AppContext';
import DynamicAsset from '../components/DynamicAsset';

const AchievementsPage: React.FC = () => {
    const { navigateTo, achievements, appAssets } = useAppContext();

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.Profile)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span className="text-base">Back to Profile</span>
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Achievements</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    Unlock badges by reaching milestones and mastering the theory test.
                </p>
            </header>

            <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((ach, index) => (
                    <div 
                        key={ach.id} 
                        className={`stagger-fade-in p-6 rounded-xl border transition-all duration-300 ${
                            ach.status === 'unlocked'
                                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-70'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 ${
                                ach.status === 'unlocked' ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-gray-100 dark:bg-slate-700'
                            }`}>
                                <DynamicAsset 
                                    asset={appAssets[ach.icon]} 
                                    className={`h-12 w-12 ${ach.status === 'unlocked' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`} 
                                />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{ach.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ach.description}</p>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
};

export default AchievementsPage;
