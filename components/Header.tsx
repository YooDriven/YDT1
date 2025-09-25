import React, { useState, useRef, useEffect, memo } from 'react';
import { Page, Notification } from '../types';
import DynamicAsset from './DynamicAsset';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabaseClient';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../contexts/AuthContext';
// FIX: Replace `useAppContext` with the correct `useApp` hook.
import { useApp } from '../contexts/AppContext';
import { useSocial } from '../contexts/SocialContext';
import { Button } from './ui';

const NotificationPanel: React.FC<{
    notifications: Notification[];
    onAccept: (userId: string, notifId: string) => void;
    onDecline: (userId: string, notifId: string) => void;
}> = ({ notifications, onAccept, onDecline }) => {
    if (notifications.length === 0) {
        return <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">No new notifications.</p>;
    }

    return (
        <ul className="py-1">
            {notifications.map(notif => (
                <li key={notif.id} className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
                    <div className="flex items-center space-x-3 mb-2">
                        <img src={notif.from_user_avatar_url} alt={notif.from_user_name} className="h-8 w-8 rounded-full" />
                        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{notif.from_user_name}</span> sent you a friend request.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="primary" className="!py-1 !px-2 !text-xs" onClick={() => onAccept(notif.from_user_id, notif.id)}>Accept</Button>
                        <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={() => onDecline(notif.from_user_id, notif.id)}>Decline</Button>
                    </div>
                </li>
            ))}
        </ul>
    );
};


const Header: React.FC = () => {
    const { userProfile } = useAuth();
    const { navigateTo, theme, setTheme, appAssets } = useApp();
    const { notifications, acceptFriendRequest, declineFriendRequest, markNotificationAsRead } = useSocial();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const isOnline = useOnlineStatus();

    const useClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: () => void) => {
        useEffect(() => {
            const listener = (event: MouseEvent) => {
                if (!ref.current || ref.current.contains(event.target as Node)) {
                    return;
                }
                handler();
            };
            document.addEventListener('mousedown', listener);
            return () => document.removeEventListener('mousedown', listener);
        }, [ref, handler]);
    };

    useClickOutside(menuRef, () => setIsMenuOpen(false));
    useClickOutside(notifRef, () => setIsNotifOpen(false));

    if (!userProfile) return null;

    const handleNavigation = (page: Page) => {
        navigateTo(page);
        setIsMenuOpen(false);
    };

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await supabase!.auth.signOut();
    };
    
    const handleAccept = async (userId: string, notifId: string) => {
        await acceptFriendRequest(userId);
        await markNotificationAsRead(notifId);
    };

    const handleDecline = async (userId: string, notifId: string) => {
        await declineFriendRequest(userId);
        await markNotificationAsRead(notifId);
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
                    
                    <div className="relative" ref={notifRef}>
                        <button onClick={() => setIsNotifOpen(p => !p)} className="p-2 rounded-full relative bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            {notifications.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications.length}</span>}
                        </button>
                         {isNotifOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
                                <NotificationPanel notifications={notifications} onAccept={handleAccept} onDecline={handleDecline} />
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="flex items-center space-x-3 group"
                        >
                            <span className="font-semibold text-base text-gray-700 dark:text-gray-300 hidden sm:inline group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{userProfile.name}</span>
                            <img
                                src={userProfile.avatarUrl}
                                alt="User Avatar"
                                className="h-10 w-10 rounded-full border-2 border-transparent group-hover:border-teal-400 transition-all duration-300 ring-2 ring-transparent group-hover:ring-teal-400/50"
                            />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
                                <ul className="py-1">
                                    {userProfile.role === 'admin' && (
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