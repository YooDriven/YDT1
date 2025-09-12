import React from 'react';
import { Page, Theme, UserProfile } from '../types';
import { ChevronLeftIcon, SunIcon, MoonIcon } from './icons';
import { supabase } from '../lib/supabaseClient';
import { Session } from 'https://esm.sh/@supabase/supabase-js@2';

interface SettingsPageProps {
    user: UserProfile;
    navigateTo: (page: Page) => void;
    session: Session | null;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, navigateTo, session, theme, setTheme }) => {

    const handleLogout = async () => {
        await supabase!.auth.signOut();
        // The onAuthStateChange listener in App.tsx will handle navigation
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.Dashboard)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">Manage your account and app preferences.</p>
            </header>

            <main className="space-y-8">
                {/* Appearance Section */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Appearance</h2>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                        <p className="text-gray-600 dark:text-gray-300 mb-3">Theme</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setTheme('light')}
                                className={`p-4 rounded-lg border-2 transition-colors ${theme === 'light' ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-gray-300 dark:border-slate-600 hover:border-teal-400'}`}
                            >
                                <SunIcon className="h-8 w-8 mx-auto mb-2 text-gray-800 dark:text-gray-200" />
                                <span className="font-semibold text-gray-800 dark:text-gray-200">Light</span>
                            </button>
                            <button 
                                onClick={() => setTheme('dark')}
                                className={`p-4 rounded-lg border-2 transition-colors ${theme === 'dark' ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-gray-300 dark:border-slate-600 hover:border-teal-400'}`}
                            >
                                <MoonIcon className="h-8 w-8 mx-auto mb-2 text-gray-800 dark:text-gray-200" />
                                <span className="font-semibold text-gray-800 dark:text-gray-200">Dark</span>
                            </button>
                        </div>
                    </div>
                </section>
                
                {/* Account Section */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Account</h2>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                            <input
                                type="text"
                                defaultValue={user.name}
                                disabled
                                className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                // FIX: Use the session object passed via props to get the email.
                                defaultValue={session?.user.email || ''}
                                disabled
                                className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                        <button className="w-full text-center bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-gray-400 font-bold py-3 rounded-lg cursor-not-allowed">
                            Change Password (Coming Soon)
                        </button>
                    </div>
                </section>
                
                {/* Logout Button */}
                 <section>
                     <button
                        onClick={handleLogout}
                        className="w-full text-center bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-bold py-3 rounded-lg hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors"
                    >
                        Logout
                    </button>
                 </section>
            </main>
        </div>
    );
};

export default SettingsPage;