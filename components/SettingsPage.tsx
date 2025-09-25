import React, { useState } from 'react';
import { Page, Theme } from '../types';
import { ChevronLeftIcon, SunIcon, MoonIcon } from './icons';
import { Button, Input, Label } from './ui';
// FIX: Replace `useAppContext` with `useApp` and `useAuth` to get data from the correct contexts.
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
    const { navigateTo, theme, setTheme, supabase } = useApp();
    const { userProfile, session, handleProfileUpdate } = useAuth();
    const user = userProfile!;

    const [name, setName] = useState(user.name);
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error'} | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [nameError, setNameError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const onProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length === 0) {
            setNameError("Display name cannot be empty.");
            return;
        }
        setNameError(null);
        setIsSaving(true);
        setMessage(null);
        const { error } = await supabase.from('profiles').update({ name }).eq('id', user.id);
        if (error) {
            setMessage({ text: `Error updating name: ${error.message}`, type: 'error' });
        } else {
            setMessage({ text: 'Display name updated successfully!', type: 'success' });
            handleProfileUpdate(name);
        }
        setIsSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length > 0 && newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            return;
        }
        setPasswordError(null);
        setIsSaving(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage({ text: `Error changing password: ${error.message}`, type: 'error' });
        } else {
            setMessage({ text: 'Password changed successfully!', type: 'success' });
            setNewPassword('');
        }
        setIsSaving(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Settings</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Manage your account and app preferences.</p>
            </header>

            <main className="space-y-8">
                {message && (
                    <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'}`}>
                        {message.text}
                    </div>
                )}
                
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">Appearance</h2>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                        <p className="text-base text-gray-600 dark:text-gray-300 mb-3">Theme</p>
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
                
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">Account</h2>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                         <form onSubmit={onProfileUpdate} className="space-y-4">
                             <div>
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    error={nameError || undefined}
                                />
                            </div>
                            <Button type="submit" variant="primary" disabled={isSaving || name === user.name} className="w-full py-3">
                                {isSaving ? 'Saving...' : 'Save Name'}
                            </Button>
                         </form>
                         <hr className="border-gray-200 dark:border-slate-600" />
                         <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    error={passwordError || undefined}
                                />
                            </div>
                            <Button type="submit" variant="primary" disabled={isSaving || !newPassword} className="w-full py-3">
                                {isSaving ? 'Changing...' : 'Change Password'}
                            </Button>
                        </form>
                    </div>
                </section>
                
                 <section>
                     <Button
                        onClick={handleLogout}
                        variant="danger"
                        className="w-full py-3"
                    >
                        Logout
                    </Button>
                 </section>
            </main>
        </div>
    );
};

export default SettingsPage;