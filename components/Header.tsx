import React, { useState, useRef, useEffect } from 'react';
import { Page, UserProfile, Theme } from '../types';
import DynamicIcon from './DynamicIcon';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabaseClient';

interface HeaderProps {
    user: UserProfile;
    navigateTo: (page: Page) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    appAssets: Record<string, string>;
}

const Header: React.FC<HeaderProps> = ({ user, navigateTo, theme, setTheme, appAssets }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        <header className="bg-white dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 p-4">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center">
                <button onClick={() => navigateTo(Page.Dashboard)}>
                    <DynamicIcon svgString={appAssets['logo_yoodrive']} />
                </button>
                <div className="flex items-center space-x-4">
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="flex items-center space-x-3"
                        >
                            <span className="font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">{user.name}</span>
                            <img
                                src={user.avatarUrl}
                                alt="User Avatar"
                                className="h-10 w-10 rounded-full border-2 border-teal-400"
                            />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-20">
                                <ul className="py-1">
                                    {user.role === 'admin' && (
                                        <li>
                                            <button onClick={() => handleNavigation(Page.Admin)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">Admin Panel</button>
                                        </li>
                                    )}
                                    <li>
                                        <button onClick={() => handleNavigation(Page.Profile)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">My Profile</button>
                                    </li>
                                    <li>
                                        <button onClick={() => handleNavigation(Page.Settings)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">Settings</button>
                                    </li>
                                    <li>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700">Logout</button>
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

export default Header;