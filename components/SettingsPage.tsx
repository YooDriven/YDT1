import React, { useState } from 'react';
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
    onProfileUpdate: (name: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, navigateTo, session, theme, setTheme, onProfileUpdate }) => {
    const [name, setName] = useState(user.name);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error'} | null>(null);
    const [isSaving, setIsSaving] =useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        const { error } = await supabase!.from('profiles').update({ name }).eq('id', user.id);
        if (error) {
            setMessage({ text: `Error updating name: ${error.message}`, type: 'error' });
        } else {
            setMessage({ text: 'Display name updated successfully!', type: 'success' });
            onProfileUpdate(name);
        }
        setIsSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        // Supabase requires re-authentication for password changes which is complex.
        // A simpler method is to use the dedicated password update function.
        const { error } = await supabase!.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage({ text: `Error changing password: ${error.message}`, type: 'error' });
        } else {
            setMessage({ text: 'Password changed successfully!', type: 'success' });
            setCurrentPassword('');
            setNewPassword('');
        }
        setIsSaving(false);
    };

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
                {message && (
                    <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'}`}>
                        {message.text}
                    </div>
                )}
                
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
                         <form onSubmit={handleProfileUpdate} className="space-y-4">
                             <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                                <input
                                    id="displayName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <button type="submit" disabled={isSaving || name === user.name} className="w-full text-center bg-[#008485] text-white font-bold py-3 rounded-lg hover:bg-[#007374] transition-colors disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save Name'}
                            </button>
                         </form>
                         <hr className="border-gray-200 dark:border-slate-600" />
                         <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <button type="submit" disabled={isSaving || !newPassword} className="w-full text-center bg-[#008485] text-white font-bold py-3 rounded-lg hover:bg-[#007374] transition-colors disabled:opacity-50">
                                {isSaving ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
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