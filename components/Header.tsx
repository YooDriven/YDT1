import React, { useState, useRef, useEffect, memo } from 'react';
import { Page, UserProfile, Theme, AppAssetRecord } from '../types';
import DynamicAsset from './DynamicAsset';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabaseClient';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
    user: UserProfile;
    navigateTo: (page: Page) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    appAssets: AppAssetRecord;
}

const Header: React.FC<HeaderProps> = ({ user, navigateTo, theme, setTheme, appAssets }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (page: Page) => {
        navigateTo(page);
        setIsMenuOpen(false);
    };

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await supabase!.auth.signOut();
    };


    return (
        <header className="bg-white dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center p-4">
                <button onClick={() => navigateTo(Page.Dashboard)} className="transition-transform hover:scale-105">
                    <DynamicAsset asset={appAssets['logo_yoodrive']} />
                </button>
                <div className="flex items-center space-x-4">
                    <div className="relative group flex items-center">
                        <span 
                            className={`h-3 w-3 rounded-full transition-colors duration-300 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}
                            aria-label={isOnline ? 'Online' : 'Offline'}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {isOnline ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="flex items-center space-x-3 group"
                        >
                            <span className="font-semibold text-base text-gray-700 dark:text-gray-300 hidden sm:inline group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{user.name}</span>
                            <img
                                src={user.avatarUrl}
                                alt="User Avatar"
                                className="h-10 w-10 rounded-full border-2 border-transparent group-hover:border-teal-400 transition-all duration-300 ring-2 ring-transparent group-hover:ring-teal-400/50"
                            />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
                                <ul className="py-1">
                                    {user.role === 'admin' && (
                                        <li>
                                            <button onClick={() => handleNavigation(Page.Admin)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">Admin Panel</button>
                                        </li>
                                    )}
                                    <li>
                                        <button onClick={() => handleNavigation(Page.Profile)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">My Profile</button>
                                    </li>
                                    <li>
                                        <button onClick={() => handleNavigation(Page.Settings)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">Settings</button>
                                    </li>
                                    <li>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Logout</button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default memo(Header);